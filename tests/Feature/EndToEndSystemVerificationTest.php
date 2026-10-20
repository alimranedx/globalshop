<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\MarketplaceCustomer;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EndToEndSystemVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $shopOwner;
    protected Plan $standardPlan;
    protected MarketplaceCustomer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.cpanel.enabled' => false]); // Mock cPanel API in test environment

        // 1. Create Super Admin
        $this->superAdmin = User::factory()->create([
            'name' => 'Platform Super Admin',
            'email' => 'superadmin@marketplace.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
        ]);

        // 2. Create Platform Plan
        $this->standardPlan = Plan::create([
            'name' => 'Pro Merchant Plan',
            'price' => 49.00,
            'limits' => [
                'max_products' => 150,
                'max_categories' => 25,
                'max_brands' => 25,
                'max_employees' => 10,
            ],
        ]);

        // 3. Create Shop Owner Candidate
        $this->shopOwner = User::factory()->create([
            'name' => 'Marcus Vance',
            'email' => 'marcus@titangear.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => false,
        ]);

        // 4. Create Marketplace Customer
        $this->customer = MarketplaceCustomer::create([
            'name' => 'David Shopper',
            'email' => 'david@shopper.com',
            'phone' => '+1234567890',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);
    }

    // =========================================================================
    // 1. ADMIN PANEL TIER VERIFICATION
    // =========================================================================

    public function test_admin_panel_state_and_provision_new_shop_workflow(): Shop
    {
        // A. Verify Super Admin State / Dashboard Stats
        $stateRes = $this->actingAs($this->superAdmin)
            ->getJson('/api/v1/platform/state');

        $stateRes->assertStatus(200);
        $stateRes->assertJsonStructure([
            'success',
            'stats' => ['total_shops', 'active_shops', 'total_plans', 'total_admins']
        ]);

        // B. Provision a New Shop with Subdomain
        $shopPayload = [
            'name' => 'Titan Gear Pro',
            'slug' => 'titan',
            'owner_id' => $this->shopOwner->id,
            'plan_id' => $this->standardPlan->id,
            'status' => 'active',
            'currency' => 'USD',
            'email' => 'support@titangear.com',
            'phone' => '+1987654321',
            'city' => 'New York',
            'country' => 'USA',
        ];

        $createRes = $this->actingAs($this->superAdmin)
            ->postJson('/api/v1/platform/shops', $shopPayload);

        $createRes->assertStatus(201);
        $createRes->assertJson([
            'success' => true,
            'data' => [
                'name' => 'Titan Gear Pro',
                'slug' => 'titan',
                'subdomain' => 'titan',
                'status' => 'active',
            ]
        ]);

        $createdShop = Shop::where('slug', 'titan')->first();
        $this->assertNotNull($createdShop);
        $this->assertEquals('titan', $createdShop->subdomain);

        // C. Verify Shop appears in Admin Directory
        $listRes = $this->actingAs($this->superAdmin)
            ->getJson('/api/v1/platform/shops?search=Titan');

        $listRes->assertStatus(200);
        $listRes->assertJsonFragment(['slug' => 'titan']);

        // D. Update Shop with Custom Domain via Admin Panel
        $updateRes = $this->actingAs($this->superAdmin)
            ->putJson("/api/v1/platform/shops/{$createdShop->id}", [
                'name' => 'Titan Gear Official Store',
                'slug' => 'titan',
                'domain' => 'titangear.com',
            ]);

        $updateRes->assertStatus(200);
        $createdShop->refresh();
        $this->assertEquals('titangear.com', $createdShop->custom_domain);
        $this->assertEquals('verified', $createdShop->custom_domain_status);

        return $createdShop;
    }

    // =========================================================================
    // 2. SHOP PANEL & STOREFRONT TIER VERIFICATION
    // =========================================================================

    protected function createTestShop(string $slug = 'titan', string $name = 'Titan Gear Pro'): Shop
    {
        $shop = Shop::create([
            'owner_id' => $this->shopOwner->id,
            'name' => $name,
            'slug' => $slug,
            'subdomain' => $slug,
            'domain' => 'titangear.com',
            'custom_domain' => 'titangear.com',
            'custom_domain_status' => 'verified',
            'status' => 'active',
            'currency' => 'USD',
        ]);

        Subscription::create([
            'shop_id' => $shop->id,
            'plan_id' => $this->standardPlan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        return $shop;
    }

    public function test_shop_subdomain_and_custom_domain_storefront_and_checkout(): void
    {
        $shop = $this->createTestShop();
        // Create Category, Brand, and In-Stock Product for Titan Gear
        $category = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Outdoor Wear',
            'slug' => 'outdoor-wear',
            'status' => 'active',
        ]);

        $brand = Brand::create([
            'shop_id' => $shop->id,
            'name' => 'Titan Vanguard',
            'slug' => 'titan-vanguard',
            'status' => 'active',
        ]);

        $product = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'created_by' => $this->shopOwner->id,
            'name' => 'Titan All-Weather Tactical Parka',
            'slug' => 'titan-tactical-parka',
            'price' => 199.99,
            'cost_price' => 110.00,
            'stock_quantity' => 25,
            'stock_unit' => 'pcs',
            'status' => 'published',
        ]);

        // A. Subdomain Storefront Access (alpha/titan.shopbusket.test)
        $subdomainRes = $this->get('http://titan.shopbusket.test/');
        $subdomainRes->assertStatus(200);
        $subdomainRes->assertViewIs('storefront');
        $subdomainRes->assertViewHas('shop', function ($s) use ($shop) {
            return $s->id === $shop->id;
        });

        // B. Custom Domain Storefront Access (titangear.com)
        $customDomainRes = $this->get('http://titangear.com/');
        $customDomainRes->assertStatus(200);
        $customDomainRes->assertViewIs('storefront');
        $customDomainRes->assertViewHas('shop', function ($s) use ($shop) {
            return $s->id === $shop->id;
        });

        // C. Direct Storefront Order Checkout API
        $checkoutPayload = [
            'customer_name' => 'Alice Shopper',
            'customer_phone' => '+1555123456',
            'payment_method' => 'cash',
            'shipping_address' => '742 Evergreen Terrace, Springfield',
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => 199.99,
                    'quantity' => 2,
                    'total' => 399.98,
                ]
            ]
        ];

        $checkoutRes = $this->withHeaders(['X-Tenant-ID' => $shop->id])
            ->postJson("/api/v1/storefront/{$shop->slug}/checkout", $checkoutPayload);

        $checkoutRes->assertStatus(200);
        $checkoutRes->assertJson([
            'success' => true,
        ]);

        // Verify stock deducted from 25 to 23
        $product->refresh();
        $this->assertEquals(23, $product->stock_quantity);

        // Verify Sale recorded in database
        $this->assertDatabaseHas('sales', [
            'shop_id' => $shop->id,
            'customer_name' => 'Alice Shopper',
            'total' => 399.98,
        ]);

        // D. Shop Owner Subdomain Login View & Authentication
        $loginViewRes = $this->get('http://titan.shopbusket.test/login');
        $loginViewRes->assertStatus(200);
        $loginViewRes->assertViewIs('shop');

        $loginPostRes = $this->post('http://titan.shopbusket.test/login', [
            'email' => 'marcus@titangear.com',
            'password' => 'password',
        ]);
        $loginPostRes->assertStatus(302);
        $this->assertAuthenticatedAs($this->shopOwner);

        // E. Authenticated Shop Panel Access on Subdomain
        $panelRes = $this->actingAs($this->shopOwner)
            ->get('http://titan.shopbusket.test/catalog-hub/categories');
        $panelRes->assertStatus(200);
        $panelRes->assertViewIs('shop');
        $panelRes->assertViewHas('shopSlug', 'titan');

        // F. Authenticated Shop Panel Access on Custom Domain
        $customPanelRes = $this->actingAs($this->shopOwner)
            ->get('http://titangear.com/catalog-hub/categories');
        $customPanelRes->assertStatus(200);
        $customPanelRes->assertViewIs('shop');

        // G. Shop Custom Domain Self-Service Management API
        TenantManager::setTenant($shop);
        $domainUpdateRes = $this->actingAs($this->shopOwner)
            ->postJson('http://titan.shopbusket.test/api/v1/tenant/custom-domain', [
                'custom_domain' => 'https://store.titangear.com/',
            ]);

        $domainUpdateRes->assertStatus(200);
        $domainUpdateRes->assertJson([
            'success' => true,
            'data' => [
                'custom_domain' => 'store.titangear.com',
            ]
        ]);

        $domainVerifyRes = $this->actingAs($this->shopOwner)
            ->postJson('http://titan.shopbusket.test/api/v1/tenant/custom-domain/verify');
        $domainVerifyRes->assertStatus(200);
        $domainVerifyRes->assertJson([
            'success' => true,
            'verified' => true,
        ]);
    }

    // =========================================================================
    // 3. USER / MARKETPLACE CUSTOMER TIER VERIFICATION
    // =========================================================================

    public function test_marketplace_customer_tier_access_and_isolation(): void
    {
        // A. Central Marketplace Root View (Guest)
        $marketplaceRes = $this->get('http://localhost/');
        $marketplaceRes->assertStatus(200);
        $marketplaceRes->assertViewIs('marketplace');

        // B. Customer Login & Session Isolation
        session(['marketplace_customer_id' => $this->customer->id]);

        $customerHomeRes = $this->get('http://localhost/');
        $customerHomeRes->assertStatus(200);
        $customerHomeRes->assertViewIs('marketplace');

        // C. Customer attempting to access Platform Admin console should be blocked
        $blockedAdminRes = $this->get('/admin');
        // Unauthenticated for the web user guard -> redirected to /admin/login
        $blockedAdminRes->assertRedirect('/admin/login');

        // D. Non-admin user cannot execute Platform Admin APIs
        $unauthorizedApiRes = $this->actingAs($this->shopOwner)
            ->getJson('/api/v1/platform/shops');
        $unauthorizedApiRes->assertStatus(403);
    }
}
