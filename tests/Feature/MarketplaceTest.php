<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
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
            'id' => (string) \Str::ulid(),
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
            'status' => 'published',
        ], ['X-Tenant-ID' => $this->shop1->id]);

        $response->assertStatus(403);

        // 4. Assign "products.index" page to the role (which normalizes products.store)
        RolePage::create([
            'role_id' => $role->id,
            'page_identifier' => 'products.index',
        ]);

        // Now creating a product should succeed
        $response2 = $this->postJson('/api/v1/tenant/products', [
            'category_id' => $this->category->id,
            'name' => 'iPhone 15 Pro',
            'price' => 999.00,
            'stock_quantity' => 10,
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
            'id' => (string) \Str::ulid(),
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
}
