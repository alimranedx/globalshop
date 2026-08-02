<?php

namespace App\Http\Controllers;

use App\Enums\StockUnit;
use App\Models\ActivityLog;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Role;
use App\Models\RolePage;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use App\Modules\AuditLog\Actions\LogActivityAction;
use App\Modules\ShopManager\Actions\RegisterShopAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlatformAdminController extends Controller
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Display the Platform Admin blade view (React SPA).
     * Unauthenticated users are redirected to the Admin Login page.
     */
    public function index(Request $request)
    {
        if (!auth()->check()) {
            return redirect('/admin/login');
        }

        $user = auth()->user();
        if (!$user->is_platform_admin) {
            // Shop owners/employees get redirected to their shop panel
            $ownedShops = $user->ownedShops()->whereNull('shops.deleted_at')->get();
            $employeeShops = $user->shops()->wherePivot('status', 'active')->whereNull('shops.deleted_at')->get();
            $allShops = $ownedShops->merge($employeeShops)->unique('id');

            if ($allShops->count() === 1) {
                return redirect()->route('shop.dashboard', ['slug' => $allShops->first()->slug]);
            } elseif ($allShops->count() > 1) {
                return redirect()->route('shop.index');
            }

            // Plain marketplace customer tried to access /admin
            return redirect('/admin/login');
        }

        return view('admin');
    }

    /**
     * Display the Admin Login page (public — no auth required).
     * If already authenticated as admin, redirect to /admin.
     */
    public function loginPage(Request $request)
    {
        if (auth()->check() && auth()->user()->is_platform_admin) {
            return redirect('/admin');
        }

        return view('admin');
    }



    /**
     * Get platform stats/state.
     */
    public function state(): JsonResponse
    {
        $totalShops = Shop::count();
        $activeShops = Shop::where('status', 'active')->count();
        $suspendedShops = Shop::where('status', 'suspended')->count();
        $totalPlans = Plan::count();
        $totalAdmins = User::where('is_platform_admin', true)->count();
        $totalLogs = ActivityLog::count();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_shops' => $totalShops,
                'active_shops' => $activeShops,
                'suspended_shops' => $suspendedShops,
                'total_plans' => $totalPlans,
                'total_admins' => $totalAdmins,
                'total_logs' => $totalLogs,
            ]
        ]);
    }

    /**
     * List all shops with optional search, status filtering, and plan filtering.
     */
    public function listShops(Request $request): JsonResponse
    {
        $query = Shop::with(['owner', 'activeSubscription.plan'])
            ->withCount(['employees', 'products', 'roles']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhereHas('owner', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($planId = $request->input('plan_id')) {
            $query->whereHas('activeSubscription', function ($sq) use ($planId) {
                $sq->where('plan_id', $planId);
            });
        }

        $shops = $query->orderBy('created_at', 'desc')->get();

        $shops->transform(function ($shop) {
            $checklist = $this->calculateShopChecklist($shop);
            $completedCount = collect($checklist)->where('completed', true)->count();
            $totalCount = count($checklist);
            $progressPercent = $totalCount > 0 ? (int) round(($completedCount / $totalCount) * 100) : 0;

            $shop->setup_checklist = $checklist;
            $shop->setup_progress = $progressPercent;
            return $shop;
        });

        return response()->json([
            'success' => true,
            'data' => $shops
        ]);
    }

    /**
     * Calculate setup checklist items for a shop.
     */
    protected function calculateShopChecklist(Shop $shop): array
    {
        return [
            [
                'key' => 'info',
                'title' => 'Shop Information',
                'description' => 'Basic shop identity, slug, and settings',
                'completed' => !empty($shop->name) && !empty($shop->slug),
            ],
            [
                'key' => 'owner',
                'title' => 'Shop Owner',
                'description' => 'Assigned Shop Owner account',
                'completed' => !empty($shop->owner_id) && $shop->owner !== null,
            ],
            [
                'key' => 'subscription',
                'title' => 'Subscription Plan',
                'description' => 'Active plan assigned to shop',
                'completed' => $shop->activeSubscription !== null,
            ],
            [
                'key' => 'roles',
                'title' => 'Roles & Permissions',
                'description' => 'Configured shop roles for staff',
                'completed' => $shop->roles()->count() > 0,
            ],
            [
                'key' => 'employees',
                'title' => 'Employees Added',
                'description' => 'At least one staff member or owner',
                'completed' => $shop->employees()->count() > 0 || $shop->owner_id !== null,
            ],
            [
                'key' => 'products',
                'title' => 'Products Catalog',
                'description' => 'Initial products added to catalog',
                'completed' => Product::withoutGlobalScope('tenant')->where('shop_id', $shop->id)->count() > 0,
            ],
            [
                'key' => 'settings',
                'title' => 'Shop Configurations',
                'description' => 'Currency, language, and refund policy set',
                'completed' => !empty($shop->currency) && !empty($shop->language),
            ],
        ];
    }

    /**
     * Store new shop (Super Admin Provisioning Wizard).
     */
    public function storeShop(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|alpha_dash|unique:shops,slug',
            'domain' => 'nullable|string|max:255|unique:shops,domain',
            'logo_url' => 'nullable|string|max:1000',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'currency' => 'nullable|string|in:USD,BDT,EUR,GBP,CAD,AUD,JPY,INR',
            'timezone' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:draft,setup_in_progress,ready_for_handover,active,suspended,pending',
            'plan_id' => 'nullable|exists:plans,id',
            'owner_id' => 'nullable|exists:users,id',
            'owner_name' => 'required_without:owner_id|nullable|string|max:255',
            'owner_email' => 'required_without:owner_id|nullable|email|unique:users,email',
            'owner_password' => 'nullable|string|min:6',
        ]);

        $status = $validated['status'] ?? 'draft';

        // Resolve owner data
        $ownerData = [];
        if (!empty($validated['owner_id'])) {
            $owner = User::findOrFail($validated['owner_id']);
            $ownerData = ['email' => $owner->email, 'name' => $owner->name];
        } else {
            $ownerData = [
                'name' => $validated['owner_name'],
                'email' => $validated['owner_email'],
                'password' => $validated['owner_password'] ?? Str::random(12),
            ];
        }

        $registerAction = resolve(RegisterShopAction::class);
        $shop = $registerAction->execute(
            [
                'name' => $validated['name'],
                'slug' => $validated['slug'] ?? null,
                'domain' => $validated['domain'] ?? null,
                'currency' => $validated['currency'] ?? 'USD',
                'language' => 'en',
            ],
            $ownerData,
            $validated['plan_id'] ?? null,
            $status
        );

        $shop->update(array_filter([
            'logo_url' => $validated['logo_url'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'country' => $validated['country'] ?? null,
            'timezone' => $validated['timezone'] ?? 'UTC',
        ], fn ($val) => $val !== null));

        $this->logger->execute(
            'shop.provisioned',
            "Shop '{$shop->name}' was provisioned by Super Admin.",
            null,
            $shop->toArray(),
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $shop->load(['owner', 'activeSubscription.plan']),
            'message' => "Shop '{$shop->name}' created successfully!"
        ], 201);
    }

    /**
     * Get detailed shop hub data.
     */
    public function showShop(Shop $shop): JsonResponse
    {
        $shop->load([
            'owner',
            'activeSubscription.plan',
            'employees' => function ($q) {
                $q->withPivot('role_id', 'status');
            },
            'roles.pages',
        ]);

        $checklist = $this->calculateShopChecklist($shop);
        $completedCount = collect($checklist)->where('completed', true)->count();
        $totalCount = count($checklist);
        $progressPercent = $totalCount > 0 ? (int) round(($completedCount / $totalCount) * 100) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'shop' => $shop,
                'counts' => [
                    'employees' => $shop->employees->count(),
                    'products' => Product::withoutGlobalScope('tenant')->where('shop_id', $shop->id)->count(),
                    'roles' => $shop->roles->count(),
                    'categories' => Category::withoutGlobalScope('tenant')->where('shop_id', $shop->id)->count(),
                    'brands' => Brand::withoutGlobalScope('tenant')->where('shop_id', $shop->id)->count(),
                ],
                'setup_checklist' => $checklist,
                'setup_progress' => $progressPercent,
            ]
        ]);
    }

    /**
     * Safely delete a shop (Soft Delete).
     */
    public function destroyShop(Request $request, Shop $shop): JsonResponse
    {
        $shopName = $shop->name;
        $oldData = $shop->toArray();

        $shop->delete();

        $this->logger->execute(
            'shop.deleted',
            "Shop '{$shopName}' was deleted by Super Admin.",
            $oldData,
            null,
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => "Shop '{$shopName}' deleted successfully."
        ]);
    }

    /**
     * Update shop handover / operational status.
     */
    public function updateHandover(Request $request, Shop $shop): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:draft,setup_in_progress,ready_for_handover,active,suspended,pending',
        ]);

        $oldStatus = $shop->status;
        $newStatus = $validated['status'];
        $shop->update(['status' => $newStatus]);

        $this->logger->execute(
            'shop.handover_status_changed',
            "Shop '{$shop->name}' status changed from {$oldStatus} to {$newStatus}.",
            ['status' => $oldStatus],
            ['status' => $newStatus],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'status' => $newStatus,
            'message' => "Shop status updated to '{$newStatus}'."
        ]);
    }

    /**
     * Search / list non-admin users for owner/employee assignment.
     */
    public function listUsers(Request $request): JsonResponse
    {
        $search = $request->input('search');
        $users = User::where('is_platform_admin', false)
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Assign existing or create new Shop Owner.
     */
    public function assignOwner(Request $request, Shop $shop): JsonResponse
    {
        $validated = $request->validate([
            'owner_id' => 'nullable|exists:users,id',
            'name' => 'required_without:owner_id|nullable|string|max:255',
            'email' => 'required_without:owner_id|nullable|email',
            'password' => 'nullable|string|min:6',
        ]);

        if (!empty($validated['owner_id'])) {
            $owner = User::findOrFail($validated['owner_id']);
        } else {
            $existing = User::where('email', $validated['email'])->first();
            if ($existing) {
                $owner = $existing;
            } else {
                $owner = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => bcrypt($validated['password'] ?? Str::random(12)),
                ]);
            }
        }

        $oldOwnerId = $shop->owner_id;
        $shop->update(['owner_id' => $owner->id]);

        $this->logger->execute(
            'shop.owner_assigned',
            "User {$owner->email} assigned as owner of Shop '{$shop->name}'.",
            ['owner_id' => $oldOwnerId],
            ['owner_id' => $owner->id],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $owner,
            'message' => "Owner assigned to '{$shop->name}' successfully."
        ]);
    }

    /**
     * List employees of a specific shop.
     */
    public function listShopEmployees(Shop $shop): JsonResponse
    {
        $employees = DB::table('shop_user')
            ->join('users', 'shop_user.user_id', '=', 'users.id')
            ->leftJoin('roles', 'shop_user.role_id', '=', 'roles.id')
            ->where('shop_user.shop_id', $shop->id)
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.created_at',
                'shop_user.status as pivot_status',
                'shop_user.role_id',
                'roles.name as role_name'
            )
            ->get();

        return response()->json([
            'success' => true,
            'data' => $employees
        ]);
    }

    /**
     * Add employee to specific shop.
     */
    public function addShopEmployee(Request $request, Shop $shop): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'name' => 'required_without:user_id|nullable|string|max:255',
            'email' => 'required_without:user_id|nullable|email',
            'password' => 'nullable|string|min:6',
            'role_id' => 'required|exists:roles,id',
        ]);

        if (!empty($validated['user_id'])) {
            $user = User::findOrFail($validated['user_id']);
        } else {
            $existing = User::where('email', $validated['email'])->first();
            if ($existing) {
                $user = $existing;
            } else {
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => bcrypt($validated['password'] ?? 'password'),
                ]);
            }
        }

        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shop->id, 'user_id' => $user->id],
            [
                'role_id' => $validated['role_id'],
                'status' => 'active',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $this->logger->execute(
            'employee.added',
            "User {$user->email} added as employee to Shop '{$shop->name}'.",
            null,
            ['shop_id' => $shop->id, 'user_id' => $user->id, 'role_id' => $validated['role_id']],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee added to shop successfully.'
        ]);
    }

    /**
     * Edit employee in specific shop.
     */
    public function updateShopEmployee(Request $request, Shop $shop, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role_id' => 'sometimes|exists:roles,id',
            'status' => 'sometimes|string|in:active,deactivated',
            'password' => 'nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $user->update(['password' => bcrypt($validated['password'])]);
        }

        $updatePivot = [];
        if (isset($validated['role_id'])) $updatePivot['role_id'] = $validated['role_id'];
        if (isset($validated['status'])) $updatePivot['status'] = $validated['status'];

        if (!empty($updatePivot)) {
            $updatePivot['updated_at'] = now();
            DB::table('shop_user')
                ->where('shop_id', $shop->id)
                ->where('user_id', $user->id)
                ->update($updatePivot);
        }

        $this->logger->execute(
            'employee.updated',
            "Employee {$user->email} in Shop '{$shop->name}' was updated.",
            null,
            $validated,
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee details updated successfully.'
        ]);
    }

    /**
     * Remove employee from shop.
     */
    public function removeShopEmployee(Request $request, Shop $shop, User $user): JsonResponse
    {
        DB::table('shop_user')
            ->where('shop_id', $shop->id)
            ->where('user_id', $user->id)
            ->delete();

        $this->logger->execute(
            'employee.removed',
            "Employee {$user->email} was removed from Shop '{$shop->name}'.",
            null,
            ['shop_id' => $shop->id, 'user_id' => $user->id],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee removed from shop successfully.'
        ]);
    }

    /**
     * List roles of a specific shop.
     */
    public function listShopRoles(Shop $shop): JsonResponse
    {
        $roles = Role::where('shop_id', $shop->id)
            ->withCount('pages')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * Store new role for shop.
     */
    public function storeShopRole(Request $request, Shop $shop): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $role = Role::create([
            'shop_id' => $shop->id,
            'name' => $validated['name'],
            'is_custom' => true,
        ]);

        $this->logger->execute(
            'role.created',
            "Role '{$role->name}' was created for Shop '{$shop->name}'.",
            null,
            $role->toArray(),
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $role,
            'message' => 'Role created successfully.'
        ], 201);
    }

    /**
     * Update role for shop.
     */
    public function updateShopRole(Request $request, Shop $shop, Role $role): JsonResponse
    {
        if ($role->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Role does not belong to this shop.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $role->update(['name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'data' => $role,
            'message' => 'Role updated successfully.'
        ]);
    }

    /**
     * Delete role for shop.
     */
    public function destroyShopRole(Request $request, Shop $shop, Role $role): JsonResponse
    {
        if ($role->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Role does not belong to this shop.'], 403);
        }

        $assignedCount = DB::table('shop_user')
            ->where('shop_id', $shop->id)
            ->where('role_id', $role->id)
            ->count();

        if ($assignedCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete role '{$role->name}' because it is assigned to {$assignedCount} employee(s)."
            ], 422);
        }

        $roleName = $role->name;
        $role->delete();

        $this->logger->execute(
            'role.deleted',
            "Role '{$roleName}' was deleted from Shop '{$shop->name}'.",
            null,
            ['shop_id' => $shop->id, 'role_name' => $roleName],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => "Role '{$roleName}' deleted successfully."
        ]);
    }

    /**
     * Get role's page permissions.
     */
    public function getShopRolePermissions(Shop $shop, Role $role): JsonResponse
    {
        if ($role->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Role does not belong to this shop.'], 403);
        }

        $pages = RolePage::where('role_id', $role->id)->pluck('page_identifier')->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'role' => $role,
                'pages' => $pages,
                'available_modules' => config('permissions.modules', []),
            ]
        ]);
    }

    /**
     * Sync page permissions for shop role.
     */
    public function syncShopRolePermissions(Request $request, Shop $shop, Role $role): JsonResponse
    {
        if ($role->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Role does not belong to this shop.'], 403);
        }

        $validated = $request->validate([
            'pages' => 'present|array',
            'pages.*' => 'string',
        ]);

        RolePage::where('role_id', $role->id)->delete();

        foreach ($validated['pages'] as $pageId) {
            RolePage::create([
                'role_id' => $role->id,
                'page_identifier' => $pageId,
            ]);
        }

        $this->logger->execute(
            'role.permissions_changed',
            "Permissions for role '{$role->name}' in Shop '{$shop->name}' were updated by Super Admin.",
            null,
            ['pages' => $validated['pages']],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Role permissions updated successfully.'
        ]);
    }

    /**
     * List products of specific shop.
     */
    public function listShopProducts(Shop $shop): JsonResponse
    {
        $products = Product::withoutGlobalScope('tenant')
            ->where('shop_id', $shop->id)
            ->with(['category', 'brand'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Store new product for shop.
     */
    public function storeShopProduct(Request $request, Shop $shop): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|numeric|min:0',
            'stock_unit' => ['nullable', 'string', Rule::enum(StockUnit::class)],
            'category_id' => 'nullable|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,draft,archived',
        ]);

        $slug = Str::slug($validated['name']) . '-' . Str::random(5);

        $product = Product::create([
            'shop_id' => $shop->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? 0,
            'stock_quantity' => $validated['stock_quantity'],
            'stock_unit' => $validated['stock_unit'] ?? 'pcs',
            'category_id' => $validated['category_id'] ?? null,
            'brand_id' => $validated['brand_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $request->user()->id,
        ]);

        $this->logger->execute(
            'product.created',
            "Product '{$product->name}' was created for Shop '{$shop->name}'.",
            null,
            $product->toArray(),
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Product created successfully.'
        ], 201);
    }

    /**
     * Update product for shop.
     */
    public function updateShopProduct(Request $request, Shop $shop, Product $product): JsonResponse
    {
        if ($product->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Product does not belong to this shop.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'sometimes|required|numeric|min:0',
            'stock_unit' => ['nullable', 'string', Rule::enum(StockUnit::class)],
            'category_id' => 'nullable|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|string|in:active,draft,archived',
        ]);

        $validated['updated_by'] = $request->user()->id;
        $product->update($validated);

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Product updated successfully.'
        ]);
    }

    /**
     * Delete product for shop.
     */
    public function destroyShopProduct(Request $request, Shop $shop, Product $product): JsonResponse
    {
        if ($product->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Product does not belong to this shop.'], 403);
        }

        $productName = $product->name;
        $product->delete();

        $this->logger->execute(
            'product.deleted',
            "Product '{$productName}' was deleted from Shop '{$shop->name}'.",
            null,
            ['product_id' => $product->id, 'name' => $productName],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => "Product '{$productName}' deleted successfully."
        ]);
    }

    /**
     * List activity logs for a specific shop.
     */
    public function listShopLogs(Shop $shop): JsonResponse
    {
        $logs = ActivityLog::where('shop_id', $shop->id)
            ->orderBy('created_at', 'desc')
            ->take(100)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * List all activity logs.
     */
    public function listLogs(): JsonResponse
    {
        $logs = ActivityLog::orderBy('created_at', 'desc')->take(50)->get();
        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Toggle shop suspension.
     */
    public function toggleSuspension(Request $request, Shop $shop): JsonResponse
    {
        $oldStatus = $shop->status;
        $newStatus = $oldStatus === 'active' ? 'suspended' : 'active';
        $shop->update(['status' => $newStatus]);

        // Log the activity
        $action = $newStatus === 'suspended' ? 'shop.suspended' : 'shop.activated';
        $this->logger->execute(
            $action,
            "Shop '{$shop->name}' status was toggled from {$oldStatus} to {$newStatus}.",
            ['status' => $oldStatus],
            ['status' => $newStatus],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'status' => $newStatus,
            'message' => "Shop status updated to {$newStatus}."
        ]);
    }

    /**
     * Approve a pending shop.
     */
    public function approveShop(Request $request, Shop $shop): JsonResponse
    {
        if ($shop->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending shops can be approved.'
            ], 422);
        }

        $shop->update(['status' => 'active']);

        $this->logger->execute(
            'shop.approved',
            "Shop '{$shop->name}' was approved by platform admin.",
            ['status' => 'pending'],
            ['status' => 'active'],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Shop approved successfully.'
        ]);
    }

    /**
     * List subscription plans.
     */
    public function listPlans(): JsonResponse
    {
        $plans = Plan::all();
        return response()->json([
            'success' => true,
            'data' => $plans
        ]);
    }

    /**
     * Store new plan.
     */
    public function storePlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'limits' => 'required|array',
            'limits.max_products' => 'required|integer|min:100',
            'limits.max_images_per_product' => 'required|integer|min:1',
            'limits.max_employees' => 'required|integer|min:1',
            'limits.max_categories' => 'sometimes|integer|min:1',
            'limits.max_brands' => 'sometimes|integer|min:1',
        ]);

        $plan = Plan::create([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'limits' => $validated['limits'],
            'is_active' => true,
        ]);

        $this->logger->execute(
            'plan.created',
            "Subscription plan '{$plan->name}' was created.",
            null,
            $plan->toArray(),
            null,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $plan,
            'message' => 'Plan created successfully.'
        ], 201);
    }

    /**
     * Update plan.
     */
    public function updatePlan(Request $request, Plan $plan): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'limits' => 'required|array',
            'limits.max_products' => 'required|integer|min:100',
            'limits.max_images_per_product' => 'required|integer|min:1',
            'limits.max_employees' => 'required|integer|min:1',
            'limits.max_categories' => 'sometimes|integer|min:1',
            'limits.max_brands' => 'sometimes|integer|min:1',
        ]);

        $oldValues = $plan->toArray();
        $plan->update($validated);

        $this->logger->execute(
            'plan.updated',
            "Subscription plan '{$plan->name}' was updated.",
            $oldValues,
            $plan->toArray(),
            null,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $plan,
            'message' => 'Plan updated successfully.'
        ]);
    }

    /**
     * List admin users.
     */
    public function listAdmins(): JsonResponse
    {
        $admins = User::where('is_platform_admin', true)->get();
        return response()->json([
            'success' => true,
            'data' => $admins
        ]);
    }

    /**
     * Store a new platform admin.
     */
    public function storeAdmin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'is_platform_admin' => true,
            'admin_permissions' => [],
        ]);

        $this->logger->execute(
            'admin.created',
            "New Platform Admin '{$admin->name}' was created.",
            null,
            ['name' => $admin->name, 'email' => $admin->email],
            null,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $admin,
            'message' => 'Admin account created successfully.'
        ], 201);
    }

    /**
     * Update admin permissions (Super Admin Only).
     */
    public function updateAdminPermissions(Request $request, User $user): JsonResponse
    {
        if ($request->user()->email !== 'superadmin@marketplace.com') {
            return response()->json(['success' => false, 'message' => 'Only Super Admin can update admin permissions.'], 403);
        }

        $validated = $request->validate([
            'pages' => 'present|array',
            'pages.*' => 'string'
        ]);

        $oldPermissions = $user->admin_permissions;
        $user->update([
            'admin_permissions' => $validated['pages']
        ]);

        $this->logger->execute(
            'admin.permissions_changed',
            "Explicit permissions for Admin '{$user->name}' were updated by Super Admin.",
            ['permissions' => $oldPermissions],
            ['permissions' => $validated['pages']],
            null,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Permissions updated successfully.'
        ]);
    }

    /**
     * Update shop details (Platform Admin Only).
     */
    public function updateShop(Request $request, Shop $shop): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|alpha_dash|unique:shops,slug,' . $shop->id,
            'domain' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'currency' => 'nullable|string|in:USD,BDT,EUR,GBP,CAD,AUD,JPY,INR',
            'timezone' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:draft,setup_in_progress,ready_for_handover,active,suspended,pending',
            'plan_id' => 'nullable|exists:plans,id',
            'refund_window_days' => 'nullable|integer|min:0|max:365',
        ]);

        $oldValues = $shop->toArray();

        $planId = $validated['plan_id'] ?? null;
        unset($validated['plan_id']);

        $shop->update($validated);

        if (!empty($planId)) {
            $activeSub = $shop->activeSubscription;
            if ($activeSub) {
                $activeSub->update(['plan_id' => $planId]);
            } else {
                Subscription::create([
                    'shop_id' => $shop->id,
                    'plan_id' => $planId,
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(),
                ]);
            }
        }

        $shop->load(['owner', 'activeSubscription.plan']);

        $this->logger->execute(
            'shop.updated',
            "Shop '{$shop->name}' details were updated by platform admin.",
            $oldValues,
            $shop->toArray(),
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $shop,
            'message' => 'Shop details updated successfully.'
        ]);
    }
}

