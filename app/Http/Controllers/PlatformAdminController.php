<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Plan;
use App\Models\Shop;
use App\Models\User;
use App\Modules\AuditLog\Actions\LogActivityAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PlatformAdminController extends Controller
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Display the Platform Admin blade view.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->is_platform_admin) {
            abort(403, 'Platform administrative access required.');
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
     * List all shops.
     */
    public function listShops(): JsonResponse
    {
        $shops = Shop::with(['owner', 'activeSubscription.plan'])->get();
        return response()->json([
            'success' => true,
            'data' => $shops
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
}
