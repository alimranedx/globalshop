<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Role;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopRegistrationApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Plan::create([
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
    }

    public function test_prospective_owner_can_register_new_shop_in_pending_status(): void
    {
        $response = $this->postJson('/api/v1/auth/register-owner', [
            'owner_name' => 'Michael Merchant',
            'email' => 'michael@myshop.com',
            'password' => 'secret123',
            'shop_name' => 'Michael Boutique',
            'shop_slug' => 'michael-boutique',
            'phone' => '+123456789',
            'city' => 'Austin',
            'country' => 'USA',
            'currency' => 'USD',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'shop' => [
                    'name' => 'Michael Boutique',
                    'slug' => 'michael-boutique',
                    'status' => 'pending',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Michael Merchant',
            'email' => 'michael@myshop.com',
        ]);

        $this->assertDatabaseHas('shops', [
            'name' => 'Michael Boutique',
            'slug' => 'michael-boutique',
            'status' => 'pending',
            'city' => 'Austin',
            'country' => 'USA',
        ]);
    }

    public function test_pending_shop_is_hidden_from_public_directory(): void
    {
        $this->postJson('/api/v1/auth/register-owner', [
            'owner_name' => 'Pending Owner',
            'email' => 'pending@shop.com',
            'password' => 'password123',
            'shop_name' => 'Hidden Pending Shop',
            'shop_slug' => 'hidden-pending',
        ]);

        $response = $this->get('/shop');
        $response->assertStatus(200);
        $response->assertDontSee('Hidden Pending Shop');

        $searchResponse = $this->getJson('/api/v1/shops/search?search=Hidden');
        $searchResponse->assertStatus(200)
            ->assertJsonCount(0, 'shops');
    }

    public function test_pending_shop_blocks_unauthorized_dashboard_access(): void
    {
        $this->postJson('/api/v1/auth/register-owner', [
            'owner_name' => 'Jane Owner',
            'email' => 'jane@pending.com',
            'password' => 'password123',
            'shop_name' => 'Jane Store',
            'shop_slug' => 'jane-store',
        ]);

        $owner = User::where('email', 'jane@pending.com')->first();
        $this->actingAs($owner);

        $response = $this->get('/shop/jane-store/dashboard');
        $response->assertStatus(403);
    }

    public function test_platform_admin_can_approve_pending_shop(): void
    {
        $admin = User::create([
            'name' => 'Platform Super Admin',
            'email' => 'superadmin@marketplace.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
        ]);

        $this->postJson('/api/v1/auth/register-owner', [
            'owner_name' => 'Robert Owner',
            'email' => 'robert@market.com',
            'password' => 'password123',
            'shop_name' => 'Robert Electronics',
            'shop_slug' => 'robert-electronics',
        ]);

        $shop = Shop::where('slug', 'robert-electronics')->first();
        $this->assertEquals('pending', $shop->status);

        // Platform Admin approves the shop
        $this->actingAs($admin);
        $approveResponse = $this->postJson("/api/v1/platform/shops/{$shop->id}/approve");

        $approveResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $shop->refresh();
        $this->assertEquals('active', $shop->status);
    }

    public function test_approved_shop_owner_can_login_and_register_employees(): void
    {
        $admin = User::create([
            'name' => 'Platform Super Admin',
            'email' => 'superadmin@marketplace.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
        ]);

        $this->postJson('/api/v1/auth/register-owner', [
            'owner_name' => 'Sarah Owner',
            'email' => 'sarah@boutique.com',
            'password' => 'secret123',
            'shop_name' => 'Sarah Boutique',
            'shop_slug' => 'sarah-boutique',
        ]);

        $shop = Shop::where('slug', 'sarah-boutique')->first();

        // Approve shop
        $this->actingAs($admin);
        $this->postJson("/api/v1/platform/shops/{$shop->id}/approve");
        $shop->refresh();
        $this->assertEquals('active', $shop->status);

        // Sarah logs into shop
        $owner = User::where('email', 'sarah@boutique.com')->first();
        $this->actingAs($owner);

        $dashboardResponse = $this->get("/shop/{$shop->slug}/dashboard");
        $dashboardResponse->assertStatus(200);

        // Sarah adds a new employee to her shop via Tenant Employee API
        $employeeResponse = $this->withHeader('X-Tenant-ID', (string) $shop->id)
            ->postJson('/api/v1/tenant/employees', [
                'name' => 'Emma Employee',
                'email' => 'emma@boutique.com',
                'password' => 'employee123',
                'role_id' => Role::where('shop_id', $shop->id)->where('name', 'Manager')->first()->id,
            ]);

        $employeeResponse->assertStatus(201)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('users', [
            'name' => 'Emma Employee',
            'email' => 'emma@boutique.com',
        ]);

        $this->assertDatabaseHas('shop_user', [
            'shop_id' => $shop->id,
            'status' => 'active',
        ]);
    }
}
