<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Role;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use App\Modules\ShopManager\Actions\RegisterShopAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubdomainShopRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected Shop $shopAlpha;
    protected User $ownerAlpha;
    protected Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->plan = Plan::create([
            'name' => 'Trial Plan',
            'price' => 0,
            'limits' => [
                'max_products' => 50,
                'max_images_per_product' => 3,
                'max_employees' => 5,
                'max_categories' => 10,
                'max_brands' => 10,
            ],
        ]);

        $this->ownerAlpha = User::factory()->create([
            'name' => 'Owner Alpha',
            'email' => 'owner@alpha.com',
            'password' => bcrypt('password'),
        ]);

        $this->shopAlpha = Shop::create([
            'owner_id' => $this->ownerAlpha->id,
            'name' => 'Shop Alpha',
            'slug' => 'alpha',
            'subdomain' => 'alpha',
            'status' => 'active',
            'currency' => 'USD',
        ]);

        Subscription::create([
            'shop_id' => $this->shopAlpha->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);
    }

    public function test_subdomain_routes_render_shop_panel_for_authenticated_owner(): void
    {
        $response = $this->actingAs($this->ownerAlpha)
            ->get('http://alpha.shopbusket.test/catalog-hub/categories');

        $response->assertStatus(200);
        $response->assertViewIs('shop');
        $response->assertViewHas('shopSlug', 'alpha');
        $response->assertViewHas('isSubdomain', true);
    }

    public function test_subdomain_dashboard_route_renders_for_authenticated_owner(): void
    {
        $response = $this->actingAs($this->ownerAlpha)
            ->get('http://alpha.shopbusket.test/dashboard');

        $response->assertStatus(200);
        $response->assertViewIs('shop');
        $response->assertViewHas('shopSlug', 'alpha');
        $response->assertViewHas('isSubdomain', true);
    }

    public function test_subdomain_login_view_renders_unauthenticated(): void
    {
        $response = $this->get('http://alpha.shopbusket.test/login');

        $response->assertStatus(200);
        $response->assertViewIs('shop');
        $response->assertViewHas('shopSlug', 'alpha');
        $response->assertViewHas('isSubdomain', true);
    }

    public function test_4th_level_subdomain_redirects_to_canonical_subdomain(): void
    {
        $response = $this->get('http://www.alpha.shopbusket.test/catalog-hub/categories');

        $response->assertStatus(301);
        $response->assertRedirect('http://alpha.shopbusket.test/catalog-hub/categories');
    }

    public function test_reserved_subdomains_are_not_routed_to_tenant(): void
    {
        $this->assertTrue(Shop::isReservedSubdomain('www'));
        $this->assertTrue(Shop::isReservedSubdomain('admin'));
        $this->assertTrue(Shop::isReservedSubdomain('api'));
        $this->assertFalse(Shop::isReservedSubdomain('my-fashion-store'));
    }

    public function test_shop_helper_generates_correct_subdomain_urls(): void
    {
        // When accessed in testing / localhost context
        $this->assertEquals('alpha.localhost', $this->shopAlpha->getSubdomainHost());
        $url = $this->shopAlpha->getSubdomainUrl('/catalog-hub/categories');
        $this->assertStringContainsString('alpha.localhost/catalog-hub/categories', $url);
    }

    public function test_newly_registered_shop_is_assigned_unique_subdomain(): void
    {
        $registrar = resolve(RegisterShopAction::class);
        $newShop = $registrar->execute(
            ['name' => 'Bravo Electronics', 'slug' => 'bravo'],
            ['name' => 'Bob Owner', 'email' => 'bob@bravo.com', 'password' => 'secret123'],
            $this->plan->id,
            'active'
        );

        $this->assertEquals('bravo', $newShop->subdomain);
        $this->assertEquals('bravo.shopbusket.com', $newShop->domain);

        $url = $newShop->getSubdomainUrl('/dashboard');
        $this->assertStringContainsString('bravo.localhost/dashboard', $url);
    }

    public function test_legacy_path_shop_alpha_redirects_to_subdomain_dashboard(): void
    {
        $response = $this->get('/shop/alpha');
        $response->assertStatus(301);
        $response->assertRedirect('http://alpha.localhost/dashboard');
    }

    public function test_legacy_path_catalog_hub_redirects_to_subdomain(): void
    {
        $response = $this->actingAs($this->ownerAlpha)->get('/shop/alpha/catalog-hub/categories');
        $response->assertStatus(301);
        $response->assertRedirect('http://alpha.localhost/catalog-hub/categories');
    }

    public function test_legacy_path_login_redirects_to_subdomain(): void
    {
        $response = $this->get('/shop/alpha/login');
        $response->assertStatus(301);
        $response->assertRedirect('http://alpha.localhost/login');
    }
}
