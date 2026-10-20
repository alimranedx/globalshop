<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Shop;
use App\Models\User;
use App\Modules\ShopManager\Actions\RegisterShopAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossShopSessionIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected User $ownerAlpha;
    protected User $ownerTitan;
    protected Shop $shopAlpha;
    protected Shop $shopTitan;
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

        // Shop Alpha
        $this->shopAlpha = $registrar->execute(
            [
                'name' => 'Alpha Electronics',
                'slug' => 'alpha',
                'subdomain' => 'alpha',
                'theme_slug' => 'tech',
            ],
            ['name' => 'John Alpha', 'email' => 'john@alpha.com', 'password' => 'password'],
            $this->plan->id,
            'active'
        );
        $this->ownerAlpha = $this->shopAlpha->owner;

        // Shop Titan
        $this->shopTitan = $registrar->execute(
            [
                'name' => 'Titan Gear Store',
                'slug' => 'titan',
                'subdomain' => 'titan',
                'theme_slug' => 'boutique',
            ],
            ['name' => 'Tom Titan', 'email' => 'tom@titan.com', 'password' => 'password'],
            $this->plan->id,
            'active'
        );
        $this->ownerTitan = $this->shopTitan->owner;
    }

    /**
     * Test unknown subdomain aborts 404 and NEVER falls back to Shop Alpha.
     */
    public function test_nonexistent_shop_subdomain_returns_404_and_never_falls_back_to_alpha(): void
    {
        $response = $this->get('http://nonexistent.shopbusket.test/');
        $response->assertStatus(404);
        $response->assertDontSee('Alpha Electronics');
    }

    /**
     * Test Alpha owner visiting Titan storefront is automatically logged out and sees Titan, not Alpha.
     */
    public function test_alpha_owner_visiting_titan_storefront_is_logged_out_and_sees_titan_details(): void
    {
        $response = $this->actingAs($this->ownerAlpha)
            ->withSession(['mock_active_tenant_id' => $this->shopAlpha->id])
            ->get('http://titan.shopbusket.test/');

        $response->assertStatus(200);
        $response->assertSee('Titan Gear Store');
        $response->assertDontSee('Alpha Electronics');
        // Confirms Alpha owner was automatically logged out
        $this->assertGuest();
        // Shows Staff Portal pointing to titan management login
        $response->assertSee('Staff Portal');
        $response->assertSee('titan.shopbusket.test/management/login');
    }

    /**
     * Test logged-in authorized Titan owner sees Dashboard and Logout buttons on storefront.
     */
    public function test_authorized_owner_sees_dashboard_and_logout_on_storefront(): void
    {
        $response = $this->actingAs($this->ownerTitan)
            ->withSession(['mock_active_tenant_id' => $this->shopTitan->id])
            ->get('http://titan.shopbusket.test/');

        $response->assertStatus(200);
        $response->assertSee('Titan Gear Store');
        $this->assertAuthenticatedAs($this->ownerTitan);
        $response->assertSee('Dashboard');
        $response->assertSee('Logout');
        $response->assertSee('titan.shopbusket.test/management/logout');
    }

    /**
     * Test subdomain logout route logs user out and redirects to shop login page.
     */
    public function test_subdomain_logout_route_logs_user_out_and_redirects_to_login(): void
    {
        $response = $this->actingAs($this->ownerTitan)
            ->withSession(['mock_active_tenant_id' => $this->shopTitan->id])
            ->get('http://titan.shopbusket.test/logout');

        $response->assertRedirect('http://titan.shopbusket.test/login');
        $this->assertGuest();
        $this->assertNull(session('mock_active_tenant_id'));
    }

    /**
     * Test Alpha owner visiting Titan login page is logged out cleanly and sees Titan login.
     */
    public function test_alpha_owner_visiting_titan_login_view_is_logged_out(): void
    {
        $response = $this->actingAs($this->ownerAlpha)
            ->withSession(['mock_active_tenant_id' => $this->shopAlpha->id])
            ->get('http://titan.shopbusket.test/login');

        $response->assertStatus(200);
        $this->assertGuest();
        $this->assertNull(session('mock_active_tenant_id'));
    }

    /**
     * Test Alpha owner visiting Titan dashboard is redirected to Titan login and logged out.
     */
    public function test_alpha_owner_visiting_titan_dashboard_redirects_to_titan_login(): void
    {
        $response = $this->actingAs($this->ownerAlpha)
            ->withSession(['mock_active_tenant_id' => $this->shopAlpha->id])
            ->get('http://titan.shopbusket.test/management/dashboard');

        $response->assertRedirect('http://titan.shopbusket.test/management/login');
        $this->assertGuest();
    }

    /**
     * Test workspace state endpoint auto-logs out unauthorized cross-shop session.
     */
    public function test_workspace_state_auto_logs_out_cross_shop_session(): void
    {
        $response = $this->actingAs($this->ownerAlpha)
            ->withSession(['mock_active_tenant_id' => $this->shopAlpha->id])
            ->get('http://titan.shopbusket.test/demo/state');

        $response->assertStatus(200);
        $response->assertJsonPath('authenticated', false);
        $response->assertJsonPath('shop.slug', 'titan');
        $this->assertGuest();
    }
}
