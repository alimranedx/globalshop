<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Role;
use App\Models\RolePage;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SalesTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $salesManager;
    protected Shop $shop;
    protected Category $category;
    protected Product $product1;
    protected Product $product2;

    protected function setUp(): void
    {
        TenantManager::setTenant(null);
        parent::setUp();

        // 1. Create Owner & Sales Manager users
        $this->owner = User::create([
            'name' => 'John Owner',
            'email' => 'john@test.com',
            'password' => bcrypt('password'),
        ]);

        $this->salesManager = User::create([
            'name' => 'Sam Sales',
            'email' => 'sam@test.com',
            'password' => bcrypt('password'),
        ]);

        // 2. Create Shop
        $this->shop = Shop::create([
            'owner_id' => $this->owner->id,
            'name' => 'Alpha Shop',
            'slug' => 'alpha',
            'status' => 'active',
        ]);

        // 3. Create Subscription plan
        $plan = Plan::create([
            'name' => 'Trial Plan',
            'price' => 0.00,
            'limits' => [
                'max_products' => 100,
                'max_images_per_product' => 2,
                'max_employees' => 5,
            ],
        ]);

        Subscription::create([
            'shop_id' => $this->shop->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        // 4. Create Sales Manager role with required permissions
        $salesRole = Role::create([
            'shop_id' => $this->shop->id,
            'name' => 'Sales Manager',
            'is_custom' => false,
        ]);

        RolePage::create(['role_id' => $salesRole->id, 'page_identifier' => 'sales.create']);
        RolePage::create(['role_id' => $salesRole->id, 'page_identifier' => 'sales.index']);

        // 5. Attach Sales Manager to shop via pivot
        DB::table('shop_user')->insert([
            'shop_id' => $this->shop->id,
            'user_id' => $this->salesManager->id,
            'role_id' => $salesRole->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 6. Seed products within the tenant context
        TenantManager::setTenant($this->shop);

        $this->category = Category::create([
            'name' => 'Groceries',
            'slug' => 'groceries',
            'shop_id' => $this->shop->id,
        ]);

        $this->product1 = Product::create([
            'shop_id' => $this->shop->id,
            'category_id' => $this->category->id,
            'name' => 'Apple Red',
            'slug' => 'apple-red',
            'price' => 2.50,
            'stock_quantity' => 10,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'created_by' => $this->owner->id,
        ]);

        $this->product2 = Product::create([
            'shop_id' => $this->shop->id,
            'category_id' => $this->category->id,
            'name' => 'Banana Yellow',
            'slug' => 'banana-yellow',
            'price' => 1.20,
            'stock_quantity' => 5,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'created_by' => $this->owner->id,
        ]);

        TenantManager::setTenant(null);
    }

    /**
     * Test that a sales manager can successfully checkout, creating a sale
     * record and decrementing product stock levels in a single transaction.
     */
    public function test_checkout_saves_sale_and_decrements_stock(): void
    {
        // Authenticate as sales manager and set the tenant context
        $this->actingAs($this->salesManager);
        TenantManager::setTenant($this->shop);

        $response = $this->postJson('/api/v1/tenant/sales', [
            'customer_name' => 'Dave Customer',
            'customer_email' => 'dave@example.com',
            'payment_method' => 'cash',
            'discount' => 1.00,
            'tax' => 0.50,
            'items' => [
                ['product_id' => $this->product1->id, 'quantity' => 2], // $5.00
                ['product_id' => $this->product2->id, 'quantity' => 1], // $1.20
            ],
        ], ['X-Tenant-ID' => $this->shop->id]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'success', 'message',
            'data' => ['id', 'invoice_number', 'subtotal', 'discount', 'tax', 'total', 'items'],
        ]);

        // Total = $5.00 + $1.20 - $1.00 + $0.50 = $5.70
        $this->assertEqualsWithDelta(5.70, (float) $response->json('data.total'), 0.001);

        // Stock should be decremented
        $this->assertEquals(8, $this->product1->fresh()->stock_quantity);
        $this->assertEquals(4, $this->product2->fresh()->stock_quantity);

        // Verify DB record
        $this->assertDatabaseHas('sales', [
            'shop_id' => $this->shop->id,
            'customer_name' => 'Dave Customer',
            'created_by' => $this->salesManager->id,
        ]);

        // Verify Daily Summary was updated
        $this->assertDatabaseHas('shop_daily_summaries', [
            'shop_id' => $this->shop->id,
            'total_orders' => 1,
            'total_revenue' => 5.70,
        ]);

        // Verify Dashboard Stats API retrieval
        $statsResponse = $this->getJson('/api/v1/tenant/dashboard-stats', ['X-Tenant-ID' => $this->shop->id]);
        $statsResponse->assertStatus(200);
        $statsResponse->assertJsonPath('success', true);
        $statsResponse->assertJsonPath('data.today.orders', 1);
        $statsResponse->assertJsonPath('data.today.revenue', 5.70);
    }

    /**
     * Test that attempting to sell more units than available stock is rejected
     * and the stock count remains unchanged (transactional rollback).
     */
    public function test_checkout_fails_on_insufficient_stock(): void
    {
        $this->actingAs($this->salesManager);
        TenantManager::setTenant($this->shop);

        $response = $this->postJson('/api/v1/tenant/sales', [
            'payment_method' => 'card',
            'items' => [
                ['product_id' => $this->product2->id, 'quantity' => 10], // Only 5 available
            ],
        ], ['X-Tenant-ID' => $this->shop->id]);

        $response->assertStatus(422);
        $response->assertJsonPath('success', false);

        // Stock must remain unchanged
        $this->assertEquals(5, $this->product2->fresh()->stock_quantity);

        // No sale should be recorded
        $this->assertDatabaseMissing('sales', ['shop_id' => $this->shop->id]);
    }

    /**
     * Test listing sales history, including filter and tenancy scoping.
     */
    public function test_can_list_sales_history(): void
    {
        // Pre-seed a mock sale in the tenant context
        TenantManager::setTenant($this->shop);
        Sale::create([
            'shop_id' => $this->shop->id,
            'invoice_number' => 'INV-TEST1234',
            'customer_name' => 'Pre-seeded Customer',
            'subtotal' => 10.00,
            'discount' => 0.00,
            'tax' => 0.00,
            'total' => 10.00,
            'payment_method' => 'card',
            'created_by' => $this->salesManager->id,
        ]);
        TenantManager::setTenant(null);

        // Fetch sales list as authenticated sales manager
        $this->actingAs($this->salesManager);
        TenantManager::setTenant($this->shop);

        $response = $this->getJson('/api/v1/tenant/sales', ['X-Tenant-ID' => $this->shop->id]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.invoice_number', 'INV-TEST1234');
    }

    /**
     * Test that the shop owner can also access the sales endpoints (owner bypass).
     */
    public function test_shop_owner_can_access_sales(): void
    {
        $this->actingAs($this->owner);
        TenantManager::setTenant($this->shop);

        $response = $this->getJson('/api/v1/tenant/sales', ['X-Tenant-ID' => $this->shop->id]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    /**
     * Test that a user without sales permissions is denied access (403).
     */
    public function test_unauthorized_user_cannot_access_sales(): void
    {
        // Create a user with no permissions
        $worker = User::create([
            'name' => 'Work Worker',
            'email' => 'worker@test.com',
            'password' => bcrypt('password'),
        ]);

        $workerRole = Role::create([
            'shop_id' => $this->shop->id,
            'name' => 'Warehouse Worker',
            'is_custom' => false,
        ]);

        // Assign only products.index - NOT sales.index
        RolePage::create(['role_id' => $workerRole->id, 'page_identifier' => 'products.index']);

        DB::table('shop_user')->insert([
            'shop_id' => $this->shop->id,
            'user_id' => $worker->id,
            'role_id' => $workerRole->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($worker);
        TenantManager::setTenant($this->shop);

        $response = $this->getJson('/api/v1/tenant/sales', ['X-Tenant-ID' => $this->shop->id]);

        $response->assertStatus(403);
    }

    /**
     * Test export to CSV format.
     */
    public function test_can_export_sales_to_csv(): void
    {
        $this->actingAs($this->owner);
        TenantManager::setTenant($this->shop);

        $response = $this->get('/api/v1/tenant/sales/export?format=csv', [
            'X-Tenant-ID' => $this->shop->id
        ]);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename=sales_export.csv');

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertStringContainsString('Invoice Number', $content);
    }

    /**
     * Test export to Excel/XLSX (XML Excel table) format.
     */
    public function test_can_export_sales_to_xlsx(): void
    {
        $this->actingAs($this->owner);
        TenantManager::setTenant($this->shop);

        $response = $this->get('/api/v1/tenant/sales/export?format=xlsx', [
            'X-Tenant-ID' => $this->shop->id
        ]);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename=sales_export.xls');
        $response->assertSee('xml version');
        $response->assertSee('ExcelWorkbook');
    }
}
