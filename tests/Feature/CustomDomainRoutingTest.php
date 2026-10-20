<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Product;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomDomainRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected Shop $shopAlpha;
    protected User $ownerAlpha;
    protected Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->plan = Plan::create([
            'name' => 'Custom Domain Plan',
            'price' => 29.99,
            'limits' => [
                'max_products' => 100,
                'max_categories' => 20,
                'max_brands' => 20,
            ],
        ]);

        $this->ownerAlpha = User::factory()->create([
            'name' => 'Alpha Merchant',
            'email' => 'merchant@alphagear.com',
            'password' => bcrypt('password'),
        ]);

        $this->shopAlpha = Shop::create([
            'owner_id' => $this->ownerAlpha->id,
            'name' => 'Alpha Gear Official',
            'slug' => 'alpha',
            'subdomain' => 'alpha',
            'domain' => 'alphagear.com',
            'custom_domain' => 'alphagear.com',
            'custom_domain_status' => 'verified',
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

    public function test_custom_domain_renders_storefront_on_root_url(): void
    {
        $response = $this->get('http://alphagear.com/');

        $response->assertStatus(200);
        $response->assertViewIs('storefront');
        $response->assertViewHas('shop', function ($shop) {
            return $shop->id === $this->shopAlpha->id && $shop->name === 'Alpha Gear Official';
        });
    }

    public function test_custom_domain_with_www_renders_storefront(): void
    {
        $response = $this->get('http://www.alphagear.com/');

        $response->assertStatus(200);
        $response->assertViewIs('storefront');
        $response->assertViewHas('shop', function ($shop) {
            return $shop->id === $this->shopAlpha->id;
        });
    }

    public function test_custom_domain_renders_catalog_and_storefront_aliases(): void
    {
        $resCatalog = $this->get('http://alphagear.com/catalog');
        $resCatalog->assertStatus(200);
        $resCatalog->assertViewIs('storefront');

        $resStorefront = $this->get('http://alphagear.com/storefront');
        $resStorefront->assertStatus(200);
        $resStorefront->assertViewIs('storefront');
    }

    public function test_custom_domain_renders_shop_login_view(): void
    {
        $response = $this->get('http://alphagear.com/login');

        $response->assertStatus(200);
        $response->assertViewIs('shop');
        $response->assertViewHas('shopSlug', 'alpha');
        $response->assertViewHas('isCustomDomain', true);
    }

    public function test_custom_domain_renders_shop_panel_for_authenticated_owner(): void
    {
        $response = $this->actingAs($this->ownerAlpha)
            ->get('http://alphagear.com/catalog-hub/categories');

        $response->assertStatus(200);
        $response->assertViewIs('shop');
        $response->assertViewHas('shopSlug', 'alpha');
        $response->assertViewHas('isCustomDomain', true);
    }

    public function test_custom_domain_redirects_unauthenticated_panel_to_login(): void
    {
        $response = $this->get('http://alphagear.com/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_central_domain_renders_marketplace(): void
    {
        $response = $this->get('http://localhost/');

        $response->assertStatus(200);
        $response->assertViewIs('marketplace');
    }

    public function test_custom_domain_api_update_and_verify(): void
    {
        TenantManager::setTenant($this->shopAlpha);

        $updateRes = $this->actingAs($this->ownerAlpha)
            ->postJson('http://alpha.shopbusket.test/api/v1/tenant/custom-domain', [
                'custom_domain' => 'https://store.mybrand.com/',
            ]);

        $updateRes->assertStatus(200);
        $updateRes->assertJson([
            'success' => true,
            'data' => [
                'custom_domain' => 'store.mybrand.com',
            ],
        ]);

        $this->assertDatabaseHas('shops', [
            'id' => $this->shopAlpha->id,
            'custom_domain' => 'store.mybrand.com',
        ]);

        $verifyRes = $this->actingAs($this->ownerAlpha)
            ->postJson('http://alpha.shopbusket.test/api/v1/tenant/custom-domain/verify');

        $verifyRes->assertStatus(200);
        $verifyRes->assertJson([
            'success' => true,
            'verified' => true,
        ]);
    }
}
