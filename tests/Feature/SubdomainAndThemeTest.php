<?php

namespace Tests\Feature;

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

class SubdomainAndThemeTest extends TestCase
{
    use RefreshDatabase;

    protected User $ownerAlpha;
    protected User $ownerBeta;
    protected Shop $shopAlpha;
    protected Shop $shopBeta;
    protected Plan $plan;

    protected function setUp(): void
    {
        TenantManager::setTenant(null);
        parent::setUp();

        $this->plan = Plan::create([
            'name' => 'Trial Plan',
            'price' => 0.00,
            'limits' => [
                'max_products' => 100,
                'max_images_per_product' => 3,
                'max_employees' => 5,
                'max_categories' => 25,
                'max_brands' => 50,
            ],
        ]);

        $registrar = resolve(RegisterShopAction::class);

        // Shop Alpha (Tech)
        $this->shopAlpha = $registrar->execute(
            [
                'name' => 'Alpha Gadgets',
                'slug' => 'alpha',
                'subdomain' => 'alpha',
                'custom_domain' => 'alphagadgets.test',
                'theme_slug' => 'tech',
            ],
            ['name' => 'John Alpha', 'email' => 'john@alpha.com', 'password' => 'password'],
            $this->plan->id,
            'active'
        );
        $this->ownerAlpha = $this->shopAlpha->owner;

        // Shop Beta (Grocery)
        $this->shopBeta = $registrar->execute(
            [
                'name' => 'Beta Organics',
                'slug' => 'beta',
                'subdomain' => 'beta',
                'custom_domain' => 'betaorganics.test',
                'theme_slug' => 'grocery',
            ],
            ['name' => 'Betty Beta', 'email' => 'betty@beta.com', 'password' => 'password'],
            $this->plan->id,
            'active'
        );
        $this->ownerBeta = $this->shopBeta->owner;

        // Add RolePage permissions so owners can access settings/theme
        $mgrRoleAlpha = Role::where('shop_id', $this->shopAlpha->id)->where('name', 'Manager')->first();
        RolePage::create(['role_id' => $mgrRoleAlpha->id, 'page_identifier' => 'settings.shop']);
        RolePage::create(['role_id' => $mgrRoleAlpha->id, 'page_identifier' => 'products.index']);
    }

    /**
     * Test shop registers with proper subdomain and theme attributes.
     */
    public function test_shop_registers_with_subdomain_and_theme(): void
    {
        $this->assertEquals('alpha', $this->shopAlpha->subdomain);
        $this->assertEquals('tech', $this->shopAlpha->theme_slug);
        $this->assertEquals('alphagadgets.test', $this->shopAlpha->custom_domain);

        $this->assertEquals('beta', $this->shopBeta->subdomain);
        $this->assertEquals('grocery', $this->shopBeta->theme_slug);
    }

    /**
     * Test subdomain and custom domain resolution via host header.
     */
    public function test_subdomain_and_custom_domain_resolution_via_host_header(): void
    {
        // 1. Subdomain matching: alpha.shopbusket.com
        $response = $this->get('http://alpha.shopbusket.com/api/v1/storefront');

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'shop' => [
                    'id' => $this->shopAlpha->id,
                    'name' => 'Alpha Gadgets',
                    'subdomain' => 'alpha',
                ],
                'theme' => [
                    'slug' => 'tech',
                ],
            ],
        ]);

        // 2. Custom Domain matching: betaorganics.test
        $responseBeta = $this->get('http://betaorganics.test/api/v1/storefront');

        $responseBeta->assertStatus(200);
        $responseBeta->assertJson([
            'success' => true,
            'data' => [
                'shop' => [
                    'id' => $this->shopBeta->id,
                    'name' => 'Beta Organics',
                    'subdomain' => 'beta',
                ],
                'theme' => [
                    'slug' => 'grocery',
                ],
            ],
        ]);
    }

    /**
     * Test shop owner can view theme registry and switch active theme.
     */
    public function test_shop_owner_can_fetch_and_switch_theme(): void
    {
        // 1. Fetch current theme & available themes
        $response = $this->actingAs($this->ownerAlpha)
            ->withSession(['mock_active_tenant_id' => $this->shopAlpha->id])
            ->getJson('/api/v1/tenant/theme');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'current_theme' => ['slug', 'name', 'category', 'config'],
                'available_themes',
                'shop' => ['id', 'name', 'subdomain'],
            ],
        ]);

        // 2. Switch theme to 'boutique' and customize colors
        $updateResponse = $this->actingAs($this->ownerAlpha)
            ->withSession(['mock_active_tenant_id' => $this->shopAlpha->id])
            ->putJson('/api/v1/tenant/theme', [
                'theme_slug' => 'boutique',
                'theme_config' => [
                    'colors' => [
                        'primary' => '#8B5CF6',
                        'accent' => '#EC4899',
                    ],
                    'announcement' => [
                        'enabled' => true,
                        'text' => 'Boutique Flash Sale!',
                    ],
                ],
            ]);

        $updateResponse->assertStatus(200);
        $updateResponse->assertJson([
            'success' => true,
            'data' => [
                'theme_slug' => 'boutique',
            ],
        ]);

        $this->shopAlpha->refresh();
        $this->assertEquals('boutique', $this->shopAlpha->theme_slug);
        $this->assertEquals('#8B5CF6', $this->shopAlpha->theme_config['colors']['primary']);
    }

    /**
     * Test shop owner can configure custom domain.
     */
    public function test_shop_owner_can_configure_custom_domain(): void
    {
        $response = $this->actingAs($this->ownerAlpha)
            ->withSession(['mock_active_tenant_id' => $this->shopAlpha->id])
            ->postJson('/api/v1/tenant/custom-domain', [
                'custom_domain' => 'https://www.myalphastore.com/',
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'custom_domain' => 'www.myalphastore.com',
            ],
        ]);

        $this->shopAlpha->refresh();
        $this->assertEquals('www.myalphastore.com', $this->shopAlpha->custom_domain);
    }

    /**
     * Test storefront renders isolated catalog and active theme.
     */
    public function test_storefront_endpoint_and_catalog_isolation(): void
    {
        // 1. Add product to Shop Alpha
        $catAlpha = Category::withoutGlobalScopes()->create(['shop_id' => $this->shopAlpha->id, 'name' => 'Smart Watches', 'slug' => 'watches']);
        $brandAlpha = Brand::withoutGlobalScopes()->create(['shop_id' => $this->shopAlpha->id, 'name' => 'AlphaBrand', 'slug' => 'alphabrand']);
        $prodAlpha = Product::withoutGlobalScopes()->create([
            'shop_id' => $this->shopAlpha->id,
            'category_id' => $catAlpha->id,
            'brand_id' => $brandAlpha->id,
            'name' => 'Alpha Chrono Pro Watch',
            'slug' => 'alpha-chrono-watch',
            'price' => 299.99,
            'cost_price' => 180.00,
            'stock_quantity' => 15,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'created_by' => $this->ownerAlpha->id,
        ]);

        // 2. Add product to Shop Beta
        $catBeta = Category::withoutGlobalScopes()->create(['shop_id' => $this->shopBeta->id, 'name' => 'Organic Lentils', 'slug' => 'lentils']);
        $brandBeta = Brand::withoutGlobalScopes()->create(['shop_id' => $this->shopBeta->id, 'name' => 'BetaFarm', 'slug' => 'betafarm']);
        $prodBeta = Product::withoutGlobalScopes()->create([
            'shop_id' => $this->shopBeta->id,
            'category_id' => $catBeta->id,
            'brand_id' => $brandBeta->id,
            'name' => 'Organic Red Lentils 5kg',
            'slug' => 'organic-red-lentils',
            'price' => 25.00,
            'cost_price' => 18.00,
            'stock_quantity' => 50,
            'stock_unit' => 'kg',
            'status' => 'published',
            'created_by' => $this->ownerBeta->id,
        ]);

        // 3. Request Storefront API for Alpha
        $responseAlpha = $this->getJson('/api/v1/storefront/alpha');
        $responseAlpha->assertStatus(200);
        $responseAlpha->assertSee('Alpha Chrono Pro Watch');
        $responseAlpha->assertDontSee('Organic Red Lentils');

        // 4. Request Storefront API for Beta
        $responseBeta = $this->getJson('/api/v1/storefront/beta');
        $responseBeta->assertStatus(200);
        $responseBeta->assertSee('Organic Red Lentils');
        $responseBeta->assertDontSee('Alpha Chrono Pro Watch');

        // 5. Verify Storefront HTML view
        $htmlResponse = $this->get('/store/alpha');
        $htmlResponse->assertStatus(200);
        $htmlResponse->assertSee('Alpha Gadgets');
        $htmlResponse->assertSee('Alpha Chrono Pro Watch');
    }
}
