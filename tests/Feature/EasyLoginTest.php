<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Role;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EasyLoginTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $manager;
    protected Shop $shop;
    protected Role $managerRole;

    protected function setUp(): void
    {
        TenantManager::setTenant(null);
        parent::setUp();

        // Setup mock models
        $this->owner = User::create([
            'name' => 'John Owner',
            'email' => 'john@owner.com',
            'password' => bcrypt('password'),
        ]);

        $this->manager = User::create([
            'name' => 'Bob Manager',
            'email' => 'bob@manager.com',
            'password' => bcrypt('password'),
        ]);

        $this->shop = Shop::create([
            'owner_id' => $this->owner->id,
            'name' => 'Shop Alpha',
            'slug' => 'alpha',
            'status' => 'active',
        ]);

        $this->managerRole = Role::create([
            'shop_id' => $this->shop->id,
            'name' => 'Manager',
        ]);

        DB::table('shop_user')->insert([
            'shop_id' => $this->shop->id,
            'user_id' => $this->manager->id,
            'role_id' => $this->managerRole->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Test page is accessible in local dev mode.
     */
    public function test_easy_login_accessible_in_local_or_debug(): void
    {
        // Simulate local environment
        config(['app.debug' => true]);

        $response = $this->get('/shop/easy-login');
        $response->assertStatus(200);
        $response->assertViewIs('shop.easy-login');
    }

    /**
     * Test page is blocked in production.
     */
    public function test_easy_login_blocked_in_production(): void
    {
        // Simulate production environment and disable debug
        app()->detectEnvironment(fn() => 'production');
        config(['app.debug' => false]);

        $response = $this->get('/shop/easy-login');
        $response->assertStatus(403);
    }

    /**
     * Test typo redirect works.
     */
    public function test_easy_lgoin_typo_redirects_to_easy_login(): void
    {
        config(['app.debug' => true]);

        $response = $this->get('/shop/easy-lgoin');
        $response->assertRedirect('/shop/easy-login');
    }

    /**
     * Test successful login mapping flow.
     */
    public function test_successful_easy_login_flow(): void
    {
        config(['app.debug' => true]);

        $response = $this->post('/shop/easy-login/login', [
            'shop_id' => $this->shop->id,
            'user_id' => $this->manager->id,
        ]);

        // Should redirect to shop dashboard
        $response->assertRedirect('/shop/' . $this->shop->slug . '/dashboard');


        // Target user should be authenticated
        $this->assertTrue(Auth::check());
        $this->assertEquals($this->manager->id, Auth::id());

        // Active tenant shop ID should be stored in session
        $this->assertEquals($this->shop->id, session('mock_active_tenant_id'));

        // Toast success message should be flashed to session
        $this->assertEquals(
            "Successfully logged in as {$this->manager->name} ({$this->shop->name})",
            session('easy_login_toast')
        );
    }

    /**
     * Test login block on suspended shop.
     */
    public function test_cannot_login_if_shop_suspended(): void
    {
        config(['app.debug' => true]);
        
        $this->shop->update(['status' => 'suspended']);

        $response = $this->post('/shop/easy-login/login', [
            'shop_id' => $this->shop->id,
            'user_id' => $this->manager->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors(['error']);
        $this->assertFalse(Auth::check());
    }

    /**
     * Test login block on inactive employee.
     */
    public function test_cannot_login_if_employee_status_inactive(): void
    {
        config(['app.debug' => true]);
        
        DB::table('shop_user')
            ->where('shop_id', $this->shop->id)
            ->where('user_id', $this->manager->id)
            ->update(['status' => 'suspended']);

        $response = $this->post('/shop/easy-login/login', [
            'shop_id' => $this->shop->id,
            'user_id' => $this->manager->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors(['error']);
        $this->assertFalse(Auth::check());
    }
}
