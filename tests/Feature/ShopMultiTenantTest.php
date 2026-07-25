<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Role;
use App\Models\Shop;
use App\Models\User;
use App\Modules\ShopManager\Actions\RegisterShopAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopMultiTenantTest extends TestCase
{
    use RefreshDatabase;

    protected User $ownerAlpha;
    protected User $ownerBeta;
    protected User $employeeAlpha;
    protected User $superAdmin;
    protected Shop $shopAlpha;
    protected Shop $shopBeta;
    protected Plan $plan;

    protected function setUp(): void
    {
        TenantManager::setTenant(null);
        parent::setUp();

        // 1. Create Trial Plan
        $this->plan = Plan::create([
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

        // 2. Create Super Admin
        $this->superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@marketplace.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
        ]);

        // 3. Register Shop Alpha
        $registrar = resolve(RegisterShopAction::class);
        $this->shopAlpha = $registrar->execute(
            ['name' => 'Shop Alpha', 'slug' => 'alpha'],
            ['name' => 'John Owner', 'email' => 'john@alpha.com', 'password' => 'password'],
            $this->plan->id,
            'active'
        );
        $this->ownerAlpha = User::where('email', 'john@alpha.com')->first();

        // 4. Register Shop Beta
        $this->shopBeta = $registrar->execute(
            ['name' => 'Shop Beta', 'slug' => 'beta'],
            ['name' => 'Bob Owner', 'email' => 'bob@beta.com', 'password' => 'password'],
            $this->plan->id,
            'active'
        );
        $this->ownerBeta = User::where('email', 'bob@beta.com')->first();

        // 5. Add Employee to Alpha
        $this->employeeAlpha = User::create([
            'name' => 'Charlie Employee',
            'email' => 'charlie@alpha.com',
            'password' => bcrypt('password'),
        ]);
        $workerRole = Role::where('shop_id', $this->shopAlpha->id)->where('name', 'Worker')->first();
        \DB::table('shop_user')->insert([
            'shop_id' => $this->shopAlpha->id,
            'user_id' => $this->employeeAlpha->id,
            'role_id' => $workerRole->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_root_url_renders_marketplace_page()
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertSee('GlobalShop');
        $response->assertViewIs('marketplace');
    }

    public function test_shop_discovery_page_lists_and_searches_shops()
    {
        $response = $this->get('/shop');
        $response->assertStatus(200);
        $response->assertSee('Shop Alpha');
        $response->assertSee('Shop Beta');

        // Search for Alpha
        $searchResponse = $this->get('/shop?search=Alpha');
        $searchResponse->assertStatus(200);
        $searchResponse->assertSee('Shop Alpha');
    }

    public function test_shop_api_search_endpoint_returns_json()
    {
        $response = $this->getJson('/api/v1/shops/search?q=alpha');
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonFragment(['slug' => 'alpha']);
    }

    public function test_shop_public_auth_entry_page_displays_shop_branding()
    {
        $response = $this->get('/shop/alpha');
        $response->assertStatus(200);
        $response->assertSee('Shop Alpha');
        $response->assertSee('Log In');

        // Non-existent shop returns 404
        $invalidResponse = $this->get('/shop/invalid-shop-slug');
        $invalidResponse->assertStatus(404);
    }

    public function test_unique_slugs_are_generated_for_duplicate_shop_names()
    {
        $slug1 = Shop::generateUniqueSlug('alpha');
        $this->assertEquals('alpha-2', $slug1);
    }

    public function test_authorized_user_can_login_to_their_shop()
    {
        $response = $this->postJson('/shop/alpha/login', [
            'email' => 'john@alpha.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertAuthenticatedAs($this->ownerAlpha);
    }

    public function test_user_cannot_access_unauthorized_shop()
    {
        // Owner Alpha attempts to log into Shop Beta
        $response = $this->postJson('/shop/beta/login', [
            'email' => 'john@alpha.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('success', false);
    }

    public function test_cross_shop_dashboard_access_is_blocked()
    {
        // Acting as Owner Alpha
        $this->actingAs($this->ownerAlpha);

        // Attempting to visit Beta dashboard
        $response = $this->get('/shop/beta/dashboard');
        $response->assertStatus(403);
    }

    public function test_super_admin_can_access_any_shop()
    {
        $this->actingAs($this->superAdmin);

        $responseAlpha = $this->get('/shop/alpha/dashboard');
        $responseAlpha->assertStatus(200);

        $responseBeta = $this->get('/shop/beta/dashboard');
        $responseBeta->assertStatus(200);
    }

    public function test_old_management_route_returns_404()
    {
        $this->actingAs($this->ownerAlpha);

        $response = $this->get('/shop/alpha/management/dashboard');
        $response->assertStatus(404);
    }

    public function test_tenant_data_isolation_prevents_cross_shop_data_leakage()
    {
        // 1. Create Category for Alpha & Beta
        $categoryAlpha = Category::create([
            'shop_id' => $this->shopAlpha->id,
            'name' => 'Alpha Category',
            'slug' => 'alpha-category',
        ]);

        $categoryBeta = Category::create([
            'shop_id' => $this->shopBeta->id,
            'name' => 'Beta Category',
            'slug' => 'beta-category',
        ]);

        // 2. Create Product in Alpha
        TenantManager::setTenant($this->shopAlpha);
        $productAlpha = Product::create([
            'shop_id' => $this->shopAlpha->id,
            'category_id' => $categoryAlpha->id,
            'name' => 'Alpha Exclusive Gadget',
            'slug' => 'alpha-gadget',
            'price' => 99.99,
            'stock_quantity' => 10,
            'created_by' => $this->ownerAlpha->id,
        ]);

        // 3. Create Product in Beta
        TenantManager::setTenant($this->shopBeta);
        $productBeta = Product::create([
            'shop_id' => $this->shopBeta->id,
            'category_id' => $categoryBeta->id,
            'name' => 'Beta Exclusive Gadget',
            'slug' => 'beta-gadget',
            'price' => 149.99,
            'stock_quantity' => 5,
            'created_by' => $this->ownerBeta->id,
        ]);

        // 4. Test fetch as Owner Alpha
        $this->actingAs($this->ownerAlpha);
        $response = $this->getJson('/api/v1/tenant/products', ['X-Tenant-ID' => $this->shopAlpha->id]);

        $response->assertStatus(200);
        $response->assertSee('Alpha Exclusive Gadget');
        $response->assertDontSee('Beta Exclusive Gadget');
    }

    public function test_guest_and_regular_user_and_customer_stay_on_root_route()
    {
        // 1. Guest visits /
        $responseGuest = $this->get('/');
        $responseGuest->assertStatus(200);
        $responseGuest->assertViewIs('marketplace');

        // 2. Regular user visits /
        $regularUser = User::create([
            'name' => 'Regular User',
            'email' => 'regular@user.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => false,
        ]);
        $this->actingAs($regularUser);
        $responseUser = $this->get('/');
        $responseUser->assertStatus(200);
        $responseUser->assertViewIs('marketplace');
        $this->assertAuthenticatedAs($regularUser);
    }

    public function test_non_regular_users_are_logged_out_when_accessing_root_route()
    {
        // 1. Super Admin visits / -> gets logged out first, then accesses /
        $this->actingAs($this->superAdmin);
        $responseSuper = $this->get('/');
        $responseSuper->assertStatus(200);
        $responseSuper->assertViewIs('marketplace');
        $this->assertGuest();

        // 2. Shop Owner visits / -> gets logged out first, then accesses /
        $this->actingAs($this->ownerAlpha);
        $responseOwner = $this->get('/');
        $responseOwner->assertStatus(200);
        $responseOwner->assertViewIs('marketplace');
        $this->assertGuest();

        // 3. Shop Employee visits / -> gets logged out first, then accesses /
        $this->actingAs($this->employeeAlpha);
        $responseEmployee = $this->get('/');
        $responseEmployee->assertStatus(200);
        $responseEmployee->assertViewIs('marketplace');
        $this->assertGuest();
    }
}
