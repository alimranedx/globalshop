<?php

namespace Tests\Feature;

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
use App\Modules\ShopManager\Actions\RegisterShopAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketplaceTest extends TestCase
{
    use RefreshDatabase;

    protected User $userOwner1;

    protected User $userOwner2;

    protected User $employee1;

    protected Shop $shop1;

    protected Shop $shop2;

    protected Plan $freePlan;

    protected Category $category;

    protected function setUp(): void
    {
        // 0. Ensure static TenantManager state is cleared before test setup
        TenantManager::setTenant(null);

        parent::setUp();

        // 1. Create standard mock users
        $this->userOwner1 = User::create([
            'name' => 'Owner One',
            'email' => 'owner1@test.com',
            'password' => bcrypt('password'),
        ]);

        $this->userOwner2 = User::create([
            'name' => 'Owner Two',
            'email' => 'owner2@test.com',
            'password' => bcrypt('password'),
        ]);

        $this->employee1 = User::create([
            'name' => 'Staff One',
            'email' => 'staff1@test.com',
            'password' => bcrypt('password'),
        ]);

        // 2. Create mock Shops
        $this->shop1 = Shop::create([
            'owner_id' => $this->userOwner1->id,
            'name' => 'Shop Alpha',
            'slug' => 'alpha',
            'status' => 'active',
        ]);

        $this->shop2 = Shop::create([
            'owner_id' => $this->userOwner2->id,
            'name' => 'Shop Beta',
            'slug' => 'beta',
            'status' => 'active',
        ]);

        // 3. Create active subscription plan with 2 product limit
        $this->freePlan = Plan::create([
            'name' => 'Trial Plan',
            'price' => 0.00,
            'limits' => [
                'max_products' => 2,
                'max_images_per_product' => 2,
                'max_employees' => 5,
            ],
        ]);

        Subscription::create([
            'shop_id' => $this->shop1->id,
            'plan_id' => $this->freePlan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        Subscription::create([
            'shop_id' => $this->shop2->id,
            'plan_id' => $this->freePlan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        // 4. Create Category
        $this->category = Category::create([
            'name' => 'Electronics',
            'slug' => 'electronics',
            'shop_id' => null, // Global category
        ]);
    }

    /**
     * Test Tenant isolation.
     * Products from Shop 1 should be completely invisible to Shop 2 query context.
     */
    public function test_tenant_isolation_is_enforced(): void
    {
        // 1. Set context to Shop 1 and create a product
        TenantManager::setTenant($this->shop1);
        Product::create([
            'category_id' => $this->category->id,
            'name' => 'iPhone 15 Pro',
            'slug' => 'iphone-15-pro',
            'price' => 999.00,
            'stock_quantity' => 10,
            'status' => 'published',
            'created_by' => $this->userOwner1->id,
        ]);

        $this->assertEquals(1, Product::count());

        // 2. Set context to Shop 2
        TenantManager::setTenant($this->shop2);

        // Shop 2 count should be 0 because it's filtered automatically by BelongsToTenant global scope
        $this->assertEquals(0, Product::count());

        // 3. Clear tenant context and query globally
        TenantManager::setTenant(null);
        $this->assertEquals(1, Product::withoutGlobalScope('tenant')->count());
    }

    /**
     * Test Page permission authorization.
     */
    public function test_page_level_authorization(): void
    {
        // 1. Create a Manager role in Shop 1
        $role = Role::create([
            'shop_id' => $this->shop1->id,
            'name' => 'Manager',
            'is_custom' => true,
        ]);

        // 2. Map Employee 1 to Shop 1 under this role
        \DB::table('shop_user')->insert([
            'shop_id' => $this->shop1->id,
            'user_id' => $this->employee1->id,
            'role_id' => $role->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Set Active Tenant to Shop 1 and authenticate Employee 1
        TenantManager::setTenant($this->shop1);
        $this->actingAs($this->employee1);

        // Accessing products.store should fail (403) because the role has no page assignments
        $response = $this->postJson('/api/v1/tenant/products', [
            'category_id' => $this->category->id,
            'name' => 'iPhone 15 Pro',
            'price' => 999.00,
            'stock_quantity' => 10,
            'stock_unit' => 'pcs',
            'status' => 'published',
        ], ['X-Tenant-ID' => $this->shop1->id]);

        $response->assertStatus(403);

        // 4. Assign "products.create" page to the role.
        // Since products.create is now explicitly mapped as its own protected page,
        // only assigning products.create (not products.index) grants POST/store access.
        RolePage::create([
            'role_id' => $role->id,
            'page_identifier' => 'products.create',
        ]);

        // Now creating a product should succeed
        $response2 = $this->postJson('/api/v1/tenant/products', [
            'category_id' => $this->category->id,
            'name' => 'iPhone 15 Pro',
            'price' => 999.00,
            'stock_quantity' => 10,
            'stock_unit' => 'pcs',
            'status' => 'published',
        ], ['X-Tenant-ID' => $this->shop1->id]);

        $response2->assertStatus(201);
    }

    /**
     * Test Subscription limits.
     * Creating products exceeding Trial Plan limits (2 products) must throw ValidationException.
     */
    public function test_subscription_limits_prevents_creation(): void
    {
        TenantManager::setTenant($this->shop1);
        $this->actingAs($this->userOwner1);

        // Owner creates product 1
        Product::create([
            'category_id' => $this->category->id,
            'name' => 'iPhone 15 Pro',
            'slug' => 'iphone-15-pro',
            'price' => 999.00,
            'stock_quantity' => 10,
            'status' => 'published',
            'created_by' => $this->userOwner1->id,
        ]);

        // Owner creates product 2
        Product::create([
            'category_id' => $this->category->id,
            'name' => 'MacBook Air M3',
            'slug' => 'macbook-air-m3',
            'price' => 1099.00,
            'stock_quantity' => 5,
            'status' => 'published',
            'created_by' => $this->userOwner1->id,
        ]);

        // Assert count is 2
        $this->assertEquals(2, Product::count());

        // Attempting to create product 3 should fail
        $response = $this->postJson('/api/v1/tenant/products', [
            'category_id' => $this->category->id,
            'name' => 'iPad Pro M4',
            'price' => 799.00,
            'stock_quantity' => 15,
            'stock_unit' => 'pcs',
            'status' => 'published',
        ], ['X-Tenant-ID' => $this->shop1->id]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('subscription');
    }

    /**
     * Test the full Shop onboarding and registration action sequence.
     */
    public function test_shop_onboarding_registration_action(): void
    {
        $action = resolve(RegisterShopAction::class);

        $shop = $action->execute(
            ['name' => 'Shop Gamma', 'slug' => 'gamma', 'domain' => 'gamma.com'],
            ['name' => 'Owner Three', 'email' => 'owner3@test.com', 'password' => 'secret123'],
            $this->freePlan->id
        );

        // Assert shop is active and domain maps correctly
        $this->assertNotNull($shop);
        $this->assertEquals('Shop Gamma', $shop->name);
        $this->assertEquals('gamma', $shop->slug);
        $this->assertEquals('gamma.com', $shop->domain);

        // Assert owner user exists in database
        $owner = User::where('email', 'owner3@test.com')->first();
        $this->assertNotNull($owner);
        $this->assertEquals($owner->id, $shop->owner_id);

        // Assert default roles created (Manager, Worker)
        $this->assertTrue(Role::where('shop_id', $shop->id)->where('name', 'Manager')->exists());
        $this->assertTrue(Role::where('shop_id', $shop->id)->where('name', 'Worker')->exists());

        // Assert subscription plan provisions
        $subscription = Subscription::where('shop_id', $shop->id)->first();
        $this->assertNotNull($subscription);
        $this->assertEquals($this->freePlan->id, $subscription->plan_id);

        // Assert activity logging matches creation
        $log = ActivityLog::where('shop_id', $shop->id)->where('action', 'shop.created')->first();
        $this->assertNotNull($log);
        $this->assertEquals($owner->id, $log->user_id);
    }

    /**
     * Test that suspended shop access is blocked by the tenant resolver.
     */
    public function test_suspended_shop_access_is_blocked(): void
    {
        $this->shop1->update(['status' => 'suspended']);

        $role = Role::create([
            'shop_id' => $this->shop1->id,
            'name' => 'Manager',
            'is_custom' => true,
        ]);

        RolePage::create([
            'role_id' => $role->id,
            'page_identifier' => 'products.index',
        ]);

        \DB::table('shop_user')->insert([
            'shop_id' => $this->shop1->id,
            'user_id' => $this->employee1->id,
            'role_id' => $role->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->employee1);

        $response = $this->postJson('/api/v1/tenant/products', [
            'category_id' => $this->category->id,
            'name' => 'iPhone 15 Pro',
            'price' => 999.00,
            'stock_quantity' => 10,
            'stock_unit' => 'pcs',
            'status' => 'published',
        ], ['X-Tenant-ID' => $this->shop1->id]);

        $response->assertStatus(403);
        $this->assertEquals('This shop has been suspended.', $response->json('message'));
    }

    /**
     * Test platform admin page-level permissions checks.
     */
    public function test_platform_admin_permissions_enforcement(): void
    {
        // 1. Create a platform admin (Grace Admin) with empty initial permissions
        $graceAdmin = User::create([
            'name' => 'Grace Admin',
            'email' => 'grace@test.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
            'admin_permissions' => [],
        ]);

        // 2. Authenticate as Grace Admin
        $this->actingAs($graceAdmin);

        // Hitting admin.shops route should fail (403) because permissions list is empty
        $response = $this->getJson('/api/v1/platform/shops');
        $response->assertStatus(403);
        $this->assertEquals('Unauthorized administrative access to page: admin.shops', $response->json('message'));

        // 3. Grant 'admin.shops' permission explicitly
        $graceAdmin->update([
            'admin_permissions' => ['admin.shops'],
        ]);

        // Accessing the page should now succeed (200)
        $response2 = $this->getJson('/api/v1/platform/shops');
        $response2->assertStatus(200);
        $response2->assertJson(['success' => true]);
    }

    /**
     * Test that ApiTokenAuthenticate middleware correctly logs in the user via email bearer token.
     */
    public function test_api_token_authentication_resolves_user(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@marketplace.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
        ]);

        // Access a platform route with an Authorization Bearer token (owner email)
        $response = $this->withHeaders([
            'Authorization' => 'Bearer superadmin@marketplace.com',
        ])->getJson('/api/v1/platform/shops');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    /**
     * Test that platform admin suspension actions toggle shop status correctly.
     */
    public function test_admin_suspension_toggles_correctly(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@marketplace.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer superadmin@marketplace.com',
        ])->postJson("/api/v1/platform/shops/{$this->shop1->id}/toggle-suspension");

        $response->assertStatus(200);
        $response->assertJson(['success' => true, 'status' => 'suspended']);

        // Check database
        $this->assertEquals('suspended', $this->shop1->fresh()->status);
    }

    /**
     * Test Category CRUD operations scoped to tenant.
     */
    public function test_category_crud_operations(): void
    {
        // 1. Create Category
        $response = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->postJson('/api/v1/tenant/categories', [
            'name' => 'Laptops & Computers',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'Laptops & Computers');
        $categoryId = $response->json('data.id');

        // 2. Read list
        $response2 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->getJson('/api/v1/tenant/categories');

        $response2->assertStatus(200);
        $this->assertCount(2, $response2->json('data')); // electronics (global) + laptops (local)

        // 3. Update Category
        $response3 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->putJson("/api/v1/tenant/categories/{$categoryId}", [
            'name' => 'Laptops and PCs',
        ]);

        $response3->assertStatus(200);
        $response3->assertJsonPath('data.name', 'Laptops and PCs');

        // 4. Delete Category
        $response4 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->deleteJson("/api/v1/tenant/categories/{$categoryId}");

        $response4->assertStatus(200);
        $response4->assertJson(['success' => true]);
    }

    /**
     * Test Brand CRUD operations scoped to tenant.
     */
    public function test_brand_crud_operations(): void
    {
        // 1. Create Brand
        $response = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->postJson('/api/v1/tenant/brands', [
            'name' => 'Brand Tech',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'Brand Tech');
        $brandId = $response->json('data.id');

        // 2. Read list
        $response2 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->getJson('/api/v1/tenant/brands');

        $response2->assertStatus(200);
        $this->assertCount(1, $response2->json('data'));

        // 3. Update Brand
        $response3 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->putJson("/api/v1/tenant/brands/{$brandId}", [
            'name' => 'Brand Tech Pro',
        ]);

        $response3->assertStatus(200);
        $response3->assertJsonPath('data.name', 'Brand Tech Pro');

        // 4. Delete Brand
        $response4 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->deleteJson("/api/v1/tenant/brands/{$brandId}");

        $response4->assertStatus(200);
        $response4->assertJson(['success' => true]);
    }

    /**
     * Test uploading category and brand logos and product images with subscription limits checks.
     */
    public function test_image_uploads_and_quota_limits(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $logoFile = \Illuminate\Http\UploadedFile::fake()->image('logo.png');

        // 1. Create Category with Logo
        $response = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->postJson('/api/v1/tenant/categories', [
            'name' => 'Phones',
            'logo' => $logoFile,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['success', 'data' => ['logo_path', 'logo_url']]);
        $categoryId = $response->json('data.id');
        $this->assertNotNull($response->json('data.logo_path'));

        // 2. Create Brand with Logo
        $response2 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->postJson('/api/v1/tenant/brands', [
            'name' => 'Brand Premium',
            'category_id' => $categoryId,
            'logo' => $logoFile,
        ]);

        $response2->assertStatus(201);
        $response2->assertJsonStructure(['success', 'data' => ['logo_path', 'logo_url']]);
        $brandId = $response2->json('data.id');

        // 3. Create Product with Images exceeding the dynamic limit (limit is 2)
        $img1 = \Illuminate\Http\UploadedFile::fake()->image('img1.png');
        $img2 = \Illuminate\Http\UploadedFile::fake()->image('img2.png');
        $img3 = \Illuminate\Http\UploadedFile::fake()->image('img3.png');

        $response3 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->postJson('/api/v1/tenant/products', [
            'category_id' => $categoryId,
            'brand_id' => $brandId,
            'name' => 'iPhone Ultra',
            'price' => 999.00,
            'stock_quantity' => 10,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'images' => [$img1, $img2, $img3], // 3 images (exceeds trial plan limit of 2)
        ]);

        // Should return 422 limit exceeded
        $response3->assertStatus(422);
        $response3->assertJsonFragment(['success' => false]);
        $this->assertStringContainsString('Product image limit exceeded', $response3->json('message'));

        // 4. Create Product with acceptable number of images (2 images)
        $response4 = $this->withHeaders([
            'Authorization' => 'Bearer owner1@test.com',
            'X-Tenant-ID' => $this->shop1->id,
        ])->postJson('/api/v1/tenant/products', [
            'category_id' => $categoryId,
            'brand_id' => $brandId,
            'name' => 'iPhone Ultra',
            'price' => 999.00,
            'stock_quantity' => 10,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'images' => [$img1, $img2], // 2 images (matches trial plan limit of 2)
        ]);

        $response4->assertStatus(201);
        $this->assertCount(2, $response4->json('data.images'));
    }

    /**
     * Test the full permission matrix, registration, approval, and employee management workflow.
     */
    public function test_permission_matrix_and_registration_workflow(): void
    {
        // 1. Register a new Shop Owner
        $regData = [
            'owner_name' => 'Jane Owner',
            'email' => 'jane@shop.com',
            'password' => 'password123',
            'shop_name' => 'Shop Gamma',
            'shop_slug' => 'gamma',
        ];

        $response = $this->postJson('/api/v1/auth/register-owner', $regData);
        $response->assertStatus(201);
        
        $shop = Shop::where('slug', 'gamma')->first();
        $this->assertNotNull($shop);
        $this->assertEquals('pending', $shop->status);

        $janeUser = User::where('email', 'jane@shop.com')->first();
        $this->assertNotNull($janeUser);

        // 2. Logging in as pending shop owner should fail access to tenant routes
        // First log in Jane
        $this->actingAs($janeUser);

        // Accessing tenant route with header X-Tenant-ID
        $response2 = $this->withHeaders([
            'X-Tenant-ID' => $shop->id,
        ])->getJson('/api/v1/tenant/products');
        
        $response2->assertStatus(403);
        $this->assertStringContainsString('pending admin approval', $response2->json('message'));

        // 3. Super Admin logs in and approves shop
        $superAdmin = User::where('email', 'superadmin@marketplace.com')->first();
        if (!$superAdmin) {
            // Create super admin if not seeded in tests
            $superAdmin = User::create([
                'name' => 'Super Admin',
                'email' => 'superadmin@marketplace.com',
                'password' => bcrypt('password'),
                'is_platform_admin' => true,
            ]);
        }

        $this->actingAs($superAdmin);

        $response3 = $this->postJson("/api/v1/platform/shops/{$shop->id}/approve");
        $response3->assertStatus(200);
        $this->assertEquals('active', $shop->fresh()->status);

        // 4. Log in back as Jane, access should now succeed
        $this->actingAs($janeUser);
        $response4 = $this->withHeaders([
            'X-Tenant-ID' => $shop->id,
        ])->getJson('/api/v1/tenant/products');
        
        $response4->assertStatus(200);

        // 5. Shop owner manages employees
        // Add a Manager
        $managerRole = Role::where('shop_id', $shop->id)->where('name', 'Manager')->first();
        $this->assertNotNull($managerRole);

        $employeeData = [
            'name' => 'Bob Manager Gamma',
            'email' => 'bobgamma@test.com',
            'password' => 'password123',
            'role_id' => $managerRole->id,
        ];

        $response5 = $this->withHeaders([
            'X-Tenant-ID' => $shop->id,
        ])->postJson('/api/v1/tenant/employees', $employeeData);

        $response5->assertStatus(201);
        $employeeId = $response5->json('data.id');
        $this->assertNotNull($employeeId);

        // Verify user was created and added to shop_user table
        $bobUser = User::find($employeeId);
        $this->assertNotNull($bobUser);
        $this->assertEquals('bobgamma@test.com', $bobUser->email);

        // Update employee's role to Worker
        $workerRole = Role::where('shop_id', $shop->id)->where('name', 'Worker')->first();
        $this->assertNotNull($workerRole);

        $response6 = $this->withHeaders([
            'X-Tenant-ID' => $shop->id,
        ])->putJson("/api/v1/tenant/employees/{$employeeId}", [
            'role_id' => $workerRole->id,
        ]);
        $response6->assertStatus(200);
        $this->assertEquals('Worker', $response6->json('data.role_name'));

        // Remove employee
        $response7 = $this->withHeaders([
            'X-Tenant-ID' => $shop->id,
        ])->deleteJson("/api/v1/tenant/employees/{$employeeId}");
        
        $response7->assertStatus(200);
        $this->assertDatabaseMissing('shop_user', [
            'shop_id' => $shop->id,
            'user_id' => $employeeId,
        ]);
    }

    public function test_category_limit_is_enforced(): void
    {
        $owner = User::create([
            'name' => 'Limit Owner',
            'email' => 'limitowner@test.com',
            'password' => bcrypt('password'),
        ]);

        $shop = Shop::create([
            'owner_id' => $owner->id,
            'name' => 'Limit Shop',
            'slug' => 'limit-shop',
            'status' => 'active',
        ]);

        $plan = Plan::create([
            'name' => 'Limited Plan',
            'price' => 0.00,
            'limits' => [
                'max_products' => 100,
                'max_categories' => 2,
                'max_brands' => 2,
            ],
        ]);

        Subscription::create([
            'shop_id' => $shop->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        $this->actingAs($owner);

        Category::create([
            'shop_id' => $shop->id,
            'name' => 'Cat 1',
            'slug' => 'cat-1',
        ]);
        Category::create([
            'shop_id' => $shop->id,
            'name' => 'Cat 2',
            'slug' => 'cat-2',
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        Category::create([
            'shop_id' => $shop->id,
            'name' => 'Cat 3',
            'slug' => 'cat-3',
        ]);
    }

    public function test_brand_limit_is_enforced(): void
    {
        $owner = User::create([
            'name' => 'Limit Owner 2',
            'email' => 'limitowner2@test.com',
            'password' => bcrypt('password'),
        ]);

        $shop = Shop::create([
            'owner_id' => $owner->id,
            'name' => 'Limit Shop 2',
            'slug' => 'limit-shop-2',
            'status' => 'active',
        ]);

        $plan = Plan::create([
            'name' => 'Limited Plan 2',
            'price' => 0.00,
            'limits' => [
                'max_products' => 100,
                'max_categories' => 2,
                'max_brands' => 2,
            ],
        ]);

        Subscription::create([
            'shop_id' => $shop->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        $this->actingAs($owner);

        $cat1 = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Cat A',
            'slug' => 'cat-a',
        ]);

        Brand::create([
            'shop_id' => $shop->id,
            'category_id' => $cat1->id,
            'name' => 'Brand 1',
            'slug' => 'brand-1',
        ]);
        Brand::create([
            'shop_id' => $shop->id,
            'category_id' => $cat1->id,
            'name' => 'Brand 2',
            'slug' => 'brand-2',
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        Brand::create([
            'shop_id' => $shop->id,
            'category_id' => $cat1->id,
            'name' => 'Brand 3',
            'slug' => 'brand-3',
        ]);
    }

    public function test_owner_can_update_shop_settings(): void
    {
        $owner = User::create([
            'name' => 'Owner Settings',
            'email' => 'ownersettings@test.com',
            'password' => bcrypt('password'),
        ]);

        $shop = Shop::create([
            'owner_id' => $owner->id,
            'name' => 'Original Name',
            'slug' => 'original-slug',
            'status' => 'active',
        ]);

        $response = $this->actingAs($owner)
            ->withHeaders(['X-Tenant-ID' => $shop->id])
            ->putJson('/api/v1/tenant/settings', [
                'name' => 'Updated Name',
                'status' => 'deactive',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.name', 'Updated Name');
        $response->assertJsonPath('data.status', 'inactive'); // deactive gets normalized to inactive

        $this->assertEquals('Updated Name', $shop->fresh()->name);
        $this->assertEquals('inactive', $shop->fresh()->status);
    }

    public function test_non_owner_cannot_update_shop_settings(): void
    {
        $owner = User::create([
            'name' => 'Owner Settings 2',
            'email' => 'ownersettings2@test.com',
            'password' => bcrypt('password'),
        ]);

        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'otheruser@test.com',
            'password' => bcrypt('password'),
        ]);

        $shop = Shop::create([
            'owner_id' => $owner->id,
            'name' => 'Original Name 2',
            'slug' => 'original-slug-2',
            'status' => 'active',
        ]);

        $response = $this->actingAs($otherUser)
            ->withHeaders(['X-Tenant-ID' => $shop->id])
            ->putJson('/api/v1/tenant/settings', [
                'name' => 'Updated Name 2',
                'status' => 'active',
            ]);

        $response->assertStatus(403);
    }
}


