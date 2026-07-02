<?php

use App\Models\ActivityLog;
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
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('welcome');
});

// Demo Session Simulator Routes
Route::prefix('demo')->group(function () {

    // 1. Initialize/Reset Demo Database Records
    Route::post('/reset', function () {
        // Clear old database records
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        ActivityLog::truncate();
        Product::truncate();
        Category::truncate();
        Subscription::truncate();
        RolePage::truncate();
        Role::truncate();
        Shop::truncate();
        User::truncate();
        Plan::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create standard plan (Trial: 2 products limit)
        $trialPlan = Plan::create([
            'name' => 'Free Trial Plan',
            'price' => 0.00,
            'limits' => [
                'max_products' => 2,
                'max_images_per_product' => 2,
                'max_employees' => 5,
            ],
        ]);

        // Create global Category
        Category::create([
            'name' => 'Fashion & Footwear',
            'slug' => 'fashion-footwear',
        ]);

        // Create Super Admin
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@marketplace.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
        ]);

        // Create Platform Admin (Grace Admin)
        $graceAdmin = User::create([
            'name' => 'Grace Admin',
            'email' => 'grace@marketplace.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
            'admin_permissions' => [], // Initially empty as per "no default full access Admin" rule
        ]);

        // Create Customer
        User::create([
            'name' => 'Alice Customer',
            'email' => 'alice@customer.com',
            'password' => bcrypt('password'),
        ]);

        // Onboard Shop Alpha via RegisterShopAction
        $registrar = resolve(RegisterShopAction::class);
        $shop = $registrar->execute(
            ['name' => 'Shop Alpha', 'slug' => 'alpha', 'domain' => 'alpha.globalshop.test'],
            ['name' => 'John Owner', 'email' => 'john@alpha.com', 'password' => 'password'],
            $trialPlan->id
        );

        // Retrieve created roles
        $managerRole = Role::where('shop_id', $shop->id)->where('name', 'Manager')->first();
        $workerRole = Role::where('shop_id', $shop->id)->where('name', 'Worker')->first();

        // Create Manager account
        $manager = User::create([
            'name' => 'Bob Manager',
            'email' => 'bob@alpha.com',
            'password' => bcrypt('password'),
        ]);
        DB::table('shop_user')->insert([
            'id' => (string) Str::ulid(),
            'shop_id' => $shop->id,
            'user_id' => $manager->id,
            'role_id' => $managerRole->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create Worker account
        $worker = User::create([
            'name' => 'Charlie Worker',
            'email' => 'charlie@alpha.com',
            'password' => bcrypt('password'),
        ]);
        DB::table('shop_user')->insert([
            'id' => (string) Str::ulid(),
            'shop_id' => $shop->id,
            'user_id' => $worker->id,
            'role_id' => $workerRole->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Demo Database Reset Completed Successfully!']);
    });

    // 2. Perform mock login session mapping
    Route::post('/login', function (Request $request) {
        $email = $request->input('email');
        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'User not found.']);
        }

        // Standard Laravel login persistence
        Auth::login($user);

        // Resolve active tenant shop scope
        $shop = Shop::where('owner_id', $user->id)->first();
        if (! $shop) {
            $shopUser = DB::table('shop_user')->where('user_id', $user->id)->first();
            if ($shopUser) {
                $shop = Shop::find($shopUser->shop_id);
            }
        }

        // If user is a platform admin (without a specific shop scope), clear active tenant
        if ($user->is_platform_admin && ! $shop) {
            session(['mock_active_tenant_id' => null]);
        } else {
            session(['mock_active_tenant_id' => $shop?->id]);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_admin' => $user->is_platform_admin,
                'role' => $shop ? ($user->id === $shop->owner_id ? 'Owner' : $user->getTenantRole($shop->id)?->name) : ($user->is_platform_admin ? ($user->email === 'superadmin@marketplace.com' ? 'Super Admin' : 'Admin') : 'Customer/Guest'),
            ],
            'shop' => $shop ? ['id' => $shop->id, 'name' => $shop->name, 'status' => $shop->status] : null,
        ]);
    });

    // 3. Retrieve Workspace state
    Route::get('/state', function () {
        $user = Auth::user();
        $shopId = session('mock_active_tenant_id');
        $shop = $shopId ? Shop::find($shopId) : null;

        if ($shop) {
            TenantManager::setTenant($shop);
        } else {
            TenantManager::setTenant(null);
        }

        // Fetch products: scoped to tenant, or global if no tenant is set
        $products = TenantManager::hasActiveTenant()
            ? Product::with(['category'])->get()
            : Product::withoutGlobalScope('tenant')->with(['shop', 'category'])->get();

        // Fetch manager role details
        $managerRole = $shop ? Role::where('shop_id', $shop->id)->where('name', 'Manager')->first() : null;
        $managerPerms = $managerRole ? $managerRole->pages()->pluck('page_identifier')->toArray() : [];

        // Fetch Grace Admin details
        $graceAdmin = User::where('email', 'grace@marketplace.com')->first();
        $gracePerms = $graceAdmin ? ($graceAdmin->admin_permissions ?? []) : [];

        // Fetch dynamic activity logs
        $logs = TenantManager::hasActiveTenant()
            ? ActivityLog::orderBy('created_at', 'desc')->take(10)->get()
            : ActivityLog::withoutGlobalScope('tenant')->orderBy('created_at', 'desc')->take(10)->get();

        return response()->json([
            'authenticated' => $user !== null,
            'user' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_admin' => $user->is_platform_admin,
                'role' => $shop ? ($user->id === $shop->owner_id ? 'Owner' : $user->getTenantRole($shop->id)?->name) : ($user->is_platform_admin ? ($user->email === 'superadmin@marketplace.com' ? 'Super Admin' : 'Admin') : 'Customer/Guest'),
            ] : null,
            'shop' => $shop ? ['id' => $shop->id, 'name' => $shop->name, 'status' => $shop->status] : null,
            'products' => $products,
            'limits' => $shop ? [
                'max_products' => TenantManager::getLimit('max_products', 100),
                'current_products' => count($products),
            ] : null,
            'permissions_config' => config('permissions.modules', []),
            'platform_permissions_config' => config('permissions.platform_admin', []),
            'manager_permissions' => $managerPerms,
            'grace_admin_permissions' => $gracePerms,
            'activity_logs' => $logs,
        ]);
    });

    // 4. Create Product with Tenant Resolution & Observer checks
    Route::post('/product', function (Request $request) {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $shopId = session('mock_active_tenant_id');
        $shop = Shop::find($shopId);

        if (! $shop) {
            return response()->json(['success' => false, 'message' => 'No active shop scope.'], 403);
        }

        if ($shop->status === 'suspended') {
            return response()->json(['success' => false, 'message' => 'This shop has been suspended.'], 403);
        }

        TenantManager::setTenant($shop);

        $category = Category::firstOrCreate(['name' => 'Fashion & Footwear', 'slug' => 'fashion-footwear']);

        try {
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $category->id,
                'name' => $request->input('name', 'Mock Product'),
                'slug' => Str::slug($request->input('name', 'Mock Product').'-'.Str::random(4)),
                'price' => $request->input('price', 49.99),
                'stock_quantity' => 10,
                'status' => 'published',
                'created_by' => $user->id,
            ]);

            // Log activity
            $logger = resolve(LogActivityAction::class);
            $logger->execute(
                'product.created',
                "Product '{$product->name}' was added.",
                null,
                $product->toArray(),
                $shop->id,
                $user->id
            );

            return response()->json(['success' => true, 'product' => $product]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => $e->validator->errors()->first('subscription')], 422);
        }
    });

    // 5. Update Manager Role permissions (checkbox sync)
    Route::post('/permissions', function (Request $request) {
        $user = Auth::user();
        $shopId = session('mock_active_tenant_id');
        $shop = Shop::find($shopId);

        if (! $shop || ($user->id !== $shop->owner_id && ! $user->is_platform_admin)) {
            return response()->json(['success' => false, 'message' => 'Only Shop Owners or Platform Admins can change permissions.'], 403);
        }

        $role = Role::where('shop_id', $shop->id)->where('name', 'Manager')->firstOrFail();

        $pages = $request->input('pages', []);

        DB::transaction(function () use ($role, $pages) {
            $role->pages()->delete();
            foreach ($pages as $page) {
                RolePage::create([
                    'role_id' => $role->id,
                    'page_identifier' => $page,
                ]);
            }
        });

        // Log action
        $logger = resolve(LogActivityAction::class);
        $logger->execute(
            'role.permissions_changed',
            'Permissions for Manager role were updated.',
            null,
            ['pages' => $pages],
            $shop->id,
            $user->id
        );

        return response()->json(['success' => true]);
    });

    // 6. Update Grace Admin (Platform Admin) permissions (Super Admin Only)
    Route::post('/admin-permissions', function (Request $request) {
        $user = Auth::user();
        if (! $user || $user->email !== 'superadmin@marketplace.com') {
            return response()->json(['success' => false, 'message' => 'Only the Super Admin can change Admin permissions.'], 403);
        }

        $grace = User::where('email', 'grace@marketplace.com')->firstOrFail();
        $pages = $request->input('pages', []);

        $grace->update([
            'admin_permissions' => $pages,
        ]);

        // Log action
        $logger = resolve(LogActivityAction::class);
        $logger->execute(
            'admin.permissions_changed',
            'Explicit permissions for Admin Grace were updated by Super Admin.',
            null,
            ['pages' => $pages],
            null,
            $user->id
        );

        return response()->json(['success' => true]);
    });

    // 7. Toggle Shop active/suspended status
    Route::post('/toggle-suspension', function () {
        $user = Auth::user();
        if (! $user || ! $user->is_platform_admin) {
            return response()->json(['success' => false, 'message' => 'Only Platform Admins can toggle shop suspension.'], 403);
        }

        $shop = Shop::where('slug', 'alpha')->firstOrFail();
        $newStatus = $shop->status === 'active' ? 'suspended' : 'active';
        $shop->update(['status' => $newStatus]);

        // Log action
        $logger = resolve(LogActivityAction::class);
        $logger->execute(
            $newStatus === 'suspended' ? 'shop.suspended' : 'shop.activated',
            "Shop Alpha status was toggled to {$newStatus}.",
            null,
            ['status' => $newStatus],
            $shop->id,
            $user->id
        );

        return response()->json(['success' => true, 'new_status' => $newStatus]);
    });
});
