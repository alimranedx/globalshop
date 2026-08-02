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

Route::get('/', function (Request $request) {
    if (auth()->check()) {
        $user = auth()->user();

        $isShopOrAdminUser = $user->is_platform_admin
            || $user->ownedShops()->whereNull('shops.deleted_at')->exists()
            || $user->shops()->wherePivot('status', 'active')->whereNull('shops.deleted_at')->exists();

        if ($isShopOrAdminUser) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            session(['mock_active_tenant_id' => null]);

            return redirect('/login');
        }
    }

    return view('marketplace');
})->name('home');

Route::get('/login', function (Request $request) {
    if ($request->wantsJson()) {
        return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
    }

    if (auth()->check()) {
        $user = auth()->user();
        $isShopOrAdminUser = $user->is_platform_admin
            || $user->ownedShops()->whereNull('shops.deleted_at')->exists()
            || $user->shops()->wherePivot('status', 'active')->whereNull('shops.deleted_at')->exists();

        if ($isShopOrAdminUser) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            session(['mock_active_tenant_id' => null]);
        }
    }

    if (session()->has('marketplace_customer_id')) {
        return redirect('/');
    }

    return view('marketplace');
})->name('login');

Route::get('/register', function (Request $request) {
    if ($request->wantsJson()) {
        return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
    }

    if (auth()->check()) {
        $user = auth()->user();
        $isShopOrAdminUser = $user->is_platform_admin
            || $user->ownedShops()->whereNull('shops.deleted_at')->exists()
            || $user->shops()->wherePivot('status', 'active')->whereNull('shops.deleted_at')->exists();

        if ($isShopOrAdminUser) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            session(['mock_active_tenant_id' => null]);
        }
    }

    if (session()->has('marketplace_customer_id')) {
        return redirect('/');
    }

    return view('marketplace');
})->name('register');

Route::get('/profile/{any?}', function (Request $request) {
    if (auth()->check()) {
        $user = auth()->user();
        $isShopOrAdminUser = $user->is_platform_admin
            || $user->ownedShops()->whereNull('shops.deleted_at')->exists()
            || $user->shops()->wherePivot('status', 'active')->whereNull('shops.deleted_at')->exists();

        if ($isShopOrAdminUser) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            session(['mock_active_tenant_id' => null]);

            return redirect('/login');
        }
    }

    return view('marketplace');
})->where('any', '.*')->name('customer.profile');

// Demo Session Simulator Routes
Route::prefix('demo')->group(function () {

    // 1. Initialize/Reset Demo Database Records
    Route::post('/reset', function () {
        try {
            // Clear old database records
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            \App\Models\SaleItem::truncate();
            \App\Models\Sale::truncate();
            ActivityLog::truncate();
            Product::truncate();
            Category::truncate();
            \App\Models\Brand::withoutGlobalScopes()->truncate();
            \App\Models\ProductImage::truncate();
            Subscription::truncate();
            RolePage::truncate();
            Role::truncate();
            DB::table('shop_user')->truncate();
            Shop::truncate();
            User::truncate();
            Plan::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            // Create standard plan (Trial: 100 products limit)
            $trialPlan = Plan::create([
                'name' => 'Free Trial Plan',
                'price' => 0.00,
                'limits' => [
                    'max_products' => 100,
                    'max_images_per_product' => 2,
                    'max_employees' => 5,
                    'max_categories' => 25,
                    'max_brands' => 50,
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
                $trialPlan->id,
                'active'
            );

            // Retrieve created roles
            $managerRole = Role::where('shop_id', $shop->id)->where('name', 'Manager')->first();
            $workerRole = Role::where('shop_id', $shop->id)->where('name', 'Worker')->first();

            // 1. Assign Manager Role Permissions
            $managerPermissions = [
                'categories.index', 'brands.index', 
                'products.index', 'products.create', 'products.edit', 'products.destroy',
                'employees.index', 'roles.index', 
                'settings.general', 'settings.shop', 'settings.subscription',
                'sales.index', 'sales.create'
            ];
            foreach ($managerPermissions as $perm) {
                RolePage::create([
                    'role_id' => $managerRole->id,
                    'page_identifier' => $perm,
                ]);
            }

            // 2. Assign Worker Role Permissions (View Only)
            $workerPermissions = [
                'products.index'
            ];
            foreach ($workerPermissions as $perm) {
                RolePage::create([
                    'role_id' => $workerRole->id,
                    'page_identifier' => $perm,
                ]);
            }

            // 3. Create Sales Manager Role and Permissions
            $salesManagerRole = Role::create([
                'shop_id' => $shop->id,
                'name' => 'Sales Manager',
                'is_custom' => false,
            ]);
            $salesManagerPermissions = [
                'products.index', 'sales.index', 'sales.create'
            ];
            foreach ($salesManagerPermissions as $perm) {
                RolePage::create([
                    'role_id' => $salesManagerRole->id,
                    'page_identifier' => $perm,
                ]);
            }

            // Create Manager account
            $manager = User::create([
                'name' => 'Bob Manager',
                'email' => 'bob@alpha.com',
                'password' => bcrypt('password'),
            ]);
            DB::table('shop_user')->insert([
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
                'shop_id' => $shop->id,
                'user_id' => $worker->id,
                'role_id' => $workerRole->id,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create Sales Manager account
            $salesManager = User::create([
                'name' => 'Sam Sales',
                'email' => 'sam@alpha.com',
                'password' => bcrypt('password'),
            ]);
            DB::table('shop_user')->insert([
                'shop_id' => $shop->id,
                'user_id' => $salesManager->id,
                'role_id' => $salesManagerRole->id,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Prepare placeholder logo files in public storage
            $logoPath = 'logos/placeholder.png';
            if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($logoPath)) {
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists('products/smartwatch.png')) {
                    \Illuminate\Support\Facades\Storage::disk('public')->copy('products/smartwatch.png', $logoPath);
                } elseif (\Illuminate\Support\Facades\Storage::disk('public')->exists('products/earbuds.png')) {
                    \Illuminate\Support\Facades\Storage::disk('public')->copy('products/earbuds.png', $logoPath);
                } else {
                    \Illuminate\Support\Facades\Storage::disk('public')->put($logoPath, 'dummy logo content');
                }
            }

            // Seed 10 Categories
            $categoryNames = [
                'Smartphones & Devices', 'Laptops & Computers', 'Audio & Music', 'Home Entertainment',
                'Kitchen & Dining', 'Smart Home Tech', 'Wearables & Watches', 'Sports & Fitness',
                'Outdoor & Camping', 'Men\'s Fashion'
            ];
            $categories = [];
            foreach ($categoryNames as $index => $name) {
                $categories[] = Category::create([
                    'shop_id' => $shop->id,
                    'name' => $name,
                    'slug' => \Illuminate\Support\Str::slug($name) . '-' . \Illuminate\Support\Str::random(4),
                    'logo_path' => $logoPath,
                ]);
            }

            // Seed 20 Brands
            $brandNames = [
                'ApexTech', 'Bolt', 'Chrono', 'Dynamo', 'Eclipse', 'Flux', 'Glide', 'Halo',
                'Infinity', 'Nova', 'Onyx', 'Pulse', 'Quantum', 'Rift', 'Summit', 'Titan',
                'Ultra', 'Vector', 'Wave', 'Zenith'
            ];
            $brands = [];
            foreach ($brandNames as $index => $name) {
                $associatedCat = $categories[$index % count($categories)];
                $brands[] = \App\Models\Brand::create([
                    'shop_id' => $shop->id,
                    'category_id' => $associatedCat->id,
                    'name' => $name,
                    'slug' => \Illuminate\Support\Str::slug($name) . '-' . \Illuminate\Support\Str::random(4),
                    'logo_path' => $logoPath,
                ]);
            }

            // Seed 30 Products
            for ($i = 1; $i <= 30; $i++) {
                $cat = $categories[$i % count($categories)];
                $brand = $brands[$i % count($brands)];

                $price = round(rand(120, 14900) / 10, 2);
                $costPrice = round($price * 0.62, 2);

                $prod = Product::create([
                    'shop_id' => $shop->id,
                    'category_id' => $cat->id,
                    'brand_id' => $brand->id,
                    'name' => "{$brand->name} {$cat->name} Series " . chr(65 + ($i % 26)),
                    'slug' => \Illuminate\Support\Str::slug("{$brand->name}-{$cat->name}-series-{$i}") . '-' . \Illuminate\Support\Str::random(4),
                    'description' => "Experience premium utility with the {$brand->name} {$cat->name} Series. Meticulously designed, reliable, and perfectly integrated into your lifestyle.",
                    'price' => $price,
                    'cost_price' => $costPrice,
                    'stock_quantity' => rand(25, 120),
                    'stock_unit' => 'pcs',
                    'status' => 'published',
                    'created_by' => $shop->owner_id,
                    'updated_by' => $shop->owner_id,
                ]);

                // Odd products get 2 images, even products get 1 image
                if ($i % 2 === 1) {
                    // Multiple images
                    \App\Models\ProductImage::create([
                        'shop_id' => $shop->id,
                        'product_id' => $prod->id,
                        'path' => 'products/smartwatch.png',
                        'sort_order' => 1,
                    ]);
                    \App\Models\ProductImage::create([
                        'shop_id' => $shop->id,
                        'product_id' => $prod->id,
                        'path' => 'products/earbuds.png',
                        'sort_order' => 2,
                    ]);
                } else {
                    // Single image
                    $path = ($i % 4 === 0) ? 'products/smartwatch.png' : 'products/earbuds.png';
                    \App\Models\ProductImage::create([
                        'shop_id' => $shop->id,
                        'product_id' => $prod->id,
                        'path' => $path,
                        'sort_order' => 1,
                    ]);
                }
            }

            return response()->json(['success' => true, 'message' => 'Demo Database Reset Completed Successfully!']);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Demo Reset Failed: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => 'Demo Reset Failed: ' . $e->getMessage()], 500);
        }
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
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'avatar_url' => $user->avatar ? asset('storage/' . $user->avatar) : null,
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
            ? Product::with(['category', 'brand', 'images'])->get()
            : Product::withoutGlobalScope('tenant')->with(['shop', 'category', 'brand', 'images'])->get();

        $products->map(function ($prod) {
            $prod->images->map(function ($img) {
                $img->image_url = asset('storage/' . $img->path);
                return $img;
            });
            return $prod;
        });

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

        // Calculate all possible module permissions for super admin bypass
        $allPermissions = [];
        foreach (config('permissions.modules', []) as $module) {
            foreach ($module['sub_modules'] as $subModule) {
                foreach ($subModule['pages'] as $pageKey => $pageLabel) {
                    $allPermissions[] = $pageKey;
                }
            }
        }

        // Determine user-specific permissions
        $userPermissions = [];
        if ($user) {
            if ($user->is_platform_admin) {
                $userPermissions = $allPermissions;
            } elseif ($shop && $user->id === $shop->owner_id) {
                $userPermissions = $allPermissions;
            } elseif ($shop) {
                $role = $user->getTenantRole($shop->id);
                $userPermissions = $role ? $role->pages()->pluck('page_identifier')->toArray() : [];
            }
        }

        return response()->json([
            'toast' => session()->pull('easy_login_toast'),
            'authenticated' => $user !== null,
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'avatar_url' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'is_platform_admin' => $user->is_platform_admin,
                'role' => $shop ? ($user->id === $shop->owner_id ? 'Owner' : $user->getTenantRole($shop->id)?->name) : ($user->is_platform_admin ? ($user->email === 'superadmin@marketplace.com' ? 'Super Admin' : 'Admin') : 'Customer/Guest'),
            ] : null,
            'shop' => $shop ? [
                'id' => $shop->id,
                'name' => $shop->name,
                'status' => $shop->status,
                'currency' => $shop->currency ?? 'USD',
                'language' => $shop->language ?? 'en',
                'refund_window_days' => $shop->refund_window_days ?? 30,
            ] : null,
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
            'user_permissions' => $userPermissions,
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

// Admin Login — public, no auth required
Route::get('/admin/login', [App\Http\Controllers\PlatformAdminController::class, 'loginPage'])->name('admin.login');

// Admin Panel SPA — protected (unauthenticated users are redirected to /admin/login by the controller)
Route::get('/admin/{any?}', [App\Http\Controllers\PlatformAdminController::class, 'index'])->where('any', '.*')->name('platform.admin');


Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout'])->name('logout');

// Local developer Easy Login routes
if (app()->environment('local') || config('app.debug')) {
    Route::middleware([\App\Modules\ShopManager\Middleware\EnsureLocalEnvironment::class])->group(function () {
        Route::get('/shop/easy-login', [\App\Modules\ShopManager\Controllers\EasyLoginController::class, 'index'])->name('shop.easy-login');
        Route::post('/shop/easy-login/login', [\App\Modules\ShopManager\Controllers\EasyLoginController::class, 'login'])->name('shop.easy-login.login');
        Route::redirect('/shop/easy-lgoin', '/shop/easy-login');
    });
}

// 1. Central Shop Discovery / Selection Page
Route::get('/shop', [\App\Http\Controllers\ShopDiscoveryController::class, 'index'])->name('shop.index');

// 2. Protected Authenticated Shop Panel Routes
Route::middleware(['auth', 'shop.access'])->group(function () {
    Route::get('/shop/{slug}/dashboard', function (string $slug) {
        $shop = \App\Models\Shop::where('slug', $slug)->first();
        if (!$shop) {
            abort(404, 'Shop not found');
        }
        return view('shop', ['shopSlug' => $slug]);
    })->name('shop.dashboard');

    Route::get('/shop/{slug}/{any}', function (string $slug, string $any) {
        $shop = \App\Models\Shop::where('slug', $slug)->first();
        if (!$shop) {
            abort(404, 'Shop not found');
        }
        return view('shop', ['shopSlug' => $slug]);
    })->where('any', 'catalog-hub.*|sales.*|customers.*|staff.*|settings.*|logs.*|products.*|categories.*|brands.*|reports.*|inventory.*|suppliers.*|purchases.*|payments.*|expenses.*|profile.*')->name('shop.panel');
});

// 3. Shop Public & Auth Entry Page
Route::get('/shop/{slug}', [\App\Http\Controllers\ShopAuthController::class, 'showEntry'])->name('shop.entry');
Route::post('/shop/{slug}/login', [\App\Http\Controllers\ShopAuthController::class, 'login'])->name('shop.login');
Route::post('/shop/{slug}/register', [\App\Http\Controllers\ShopAuthController::class, 'register'])->name('shop.register');



