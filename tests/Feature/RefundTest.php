<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Refund;
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
use Carbon\Carbon;

class RefundTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $worker;
    protected User $manager;
    protected Shop $shop;
    protected Category $category;
    protected Product $product;
    protected Sale $sale;

    protected function setUp(): void
    {
        TenantManager::setTenant(null);
        parent::setUp();

        // 1. Create Users
        $this->owner = User::create([
            'name' => 'Shop Owner',
            'email' => 'owner@shop.com',
            'password' => bcrypt('password'),
        ]);

        $this->worker = User::create([
            'name' => 'Worker User',
            'email' => 'worker@shop.com',
            'password' => bcrypt('password'),
        ]);

        $this->manager = User::create([
            'name' => 'Manager User',
            'email' => 'manager@shop.com',
            'password' => bcrypt('password'),
        ]);

        // 2. Create Shop
        $this->shop = Shop::create([
            'owner_id' => $this->owner->id,
            'name' => 'Refund Demo Shop',
            'slug' => 'refund-demo',
            'status' => 'active',
            'refund_window_days' => 30,
        ]);

        // 3. Create Role & RolePages (Manager has approve, Worker has none)
        $managerRole = Role::create([
            'shop_id' => $this->shop->id,
            'name' => 'Manager',
            'is_custom' => true,
        ]);
        RolePage::create([
            'role_id' => $managerRole->id,
            'page_identifier' => 'sales.refund_approve',
        ]);

        $workerRole = Role::create([
            'shop_id' => $this->shop->id,
            'name' => 'Worker',
            'is_custom' => true,
        ]);

        // Assign users to shop
        DB::table('shop_user')->insert([
            [
                'shop_id' => $this->shop->id,
                'user_id' => $this->manager->id,
                'role_id' => $managerRole->id,
                'status' => 'active',
            ],
            [
                'shop_id' => $this->shop->id,
                'user_id' => $this->worker->id,
                'role_id' => $workerRole->id,
                'status' => 'active',
            ]
        ]);

        // 4. Create Category, Product
        $this->category = Category::create([
            'shop_id' => $this->shop->id,
            'name' => 'Electronics',
            'slug' => 'electronics',
        ]);

        $this->product = Product::create([
            'shop_id' => $this->shop->id,
            'category_id' => $this->category->id,
            'name' => 'Keyboard',
            'slug' => 'keyboard',
            'price' => 100.00,
            'cost_price' => 60.00,
            'stock_quantity' => 20,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'created_by' => $this->owner->id,
        ]);

        // 5. Create a Sale
        $this->sale = Sale::create([
            'shop_id' => $this->shop->id,
            'invoice_number' => 'INV-TEST-123',
            'subtotal' => 200.00,
            'discount' => 0.00,
            'tax' => 0.00,
            'total' => 200.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'refunded_amount' => 0.00,
            'created_by' => $this->owner->id,
        ]);

        $this->sale->items()->create([
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'quantity' => 2.00,
            'price' => 100.00,
            'cost_price' => 60.00,
            'total' => 200.00,
        ]);
    }

    /**
     * Test direct refund (Owner role).
     */
    public function test_owner_direct_refund(): void
    {
        $this->actingAs($this->owner);

        $payload = [
            'refund_amount' => 100.00,
            'type' => 'partial',
            'refund_method' => 'cash',
            'reason' => 'Defective item',
            'items' => [
                [
                    'sale_item_id' => $this->sale->items->first()->id,
                    'quantity' => 1.00,
                    'refund_amount' => 100.00,
                    'restock' => true,
                ]
            ]
        ];

        $response = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->postJson("/api/v1/tenant/sales/{$this->sale->id}/refund", $payload);

        $response->assertStatus(201);
        $this->assertEquals('completed', $response->json('data.status'));

        // Assert stock was incremented by 1
        $this->assertEquals(21, $this->product->fresh()->stock_quantity);

        // Assert sale status and amount
        $sale = $this->sale->fresh();
        $this->assertEquals('partially_refunded', $sale->status);
        $this->assertEquals(100.00, $sale->refunded_amount);
        $this->assertEquals(1.00, $sale->items->first()->refunded_qty);

        // Assert summary log
        $this->assertDatabaseHas('shop_daily_summaries', [
            'shop_id' => $this->shop->id,
            'total_refunds' => 100.00,
            'total_refund_count' => 1,
        ]);
    }

    /**
     * Test refund approval flow for workers (goes to pending).
     */
    public function test_worker_refund_requires_approval(): void
    {
        $this->actingAs($this->worker);

        $payload = [
            'refund_amount' => 100.00,
            'type' => 'partial',
            'refund_method' => 'cash',
            'reason' => 'Size issues',
            'items' => [
                [
                    'sale_item_id' => $this->sale->items->first()->id,
                    'quantity' => 1.00,
                    'refund_amount' => 100.00,
                    'restock' => true,
                ]
            ]
        ];

        $response = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->postJson("/api/v1/tenant/sales/{$this->sale->id}/refund", $payload);

        $response->assertStatus(201);
        $this->assertEquals('pending', $response->json('data.status'));

        // Stock and Sale shouldn't change
        $this->assertEquals(20, $this->product->fresh()->stock_quantity);
        $this->assertEquals('completed', $this->sale->fresh()->status);
        $this->assertEquals(0.00, $this->sale->fresh()->refunded_amount);
        $this->assertEquals(0.00, $this->sale->items->first()->fresh()->refunded_qty);

        // Now manager approves the refund
        $refundId = $response->json('data.id');
        $this->actingAs($this->manager);

        $approveResponse = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->postJson("/api/v1/tenant/refunds/{$refundId}/approve");

        $approveResponse->assertStatus(200);
        $this->assertEquals('completed', $approveResponse->json('data.status'));

        // Stock and sale updated
        $this->assertEquals(21, $this->product->fresh()->stock_quantity);
        $this->assertEquals('partially_refunded', $this->sale->fresh()->status);
        $this->assertEquals(100.00, $this->sale->fresh()->refunded_amount);
    }

    /**
     * Test refund window restrictions.
     */
    public function test_refund_window_enforcement(): void
    {
        // Make sale older than 30 days
        $this->sale->created_at = Carbon::now()->subDays(35);
        $this->sale->save();

        // Worker attempts refund -> blocked
        $this->actingAs($this->worker);

        $payload = [
            'refund_amount' => 200.00,
            'type' => 'full',
            'refund_method' => 'cash',
            'reason' => 'Broken',
        ];

        $response = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->postJson("/api/v1/tenant/sales/{$this->sale->id}/refund", $payload);

        $response->assertStatus(422);
        $this->assertStringContainsString('exceeds the shop\'s refund window', $response->json('message'));

        // Owner attempts refund -> allowed
        $this->actingAs($this->owner);
        $ownerResponse = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->postJson("/api/v1/tenant/sales/{$this->sale->id}/refund", $payload);

        $ownerResponse->assertStatus(201);
        $this->assertEquals('completed', $ownerResponse->json('data.status'));
    }

    /**
     * Test store credit refunds.
     */
    public function test_store_credit_refund(): void
    {
        $this->actingAs($this->owner);

        // Guest user tracked by phone number
        $payload = [
            'refund_amount' => 150.00,
            'type' => 'partial',
            'refund_method' => 'store_credit',
            'reason' => 'Store Credit requested',
            'customer_name' => 'Alice Member',
            'customer_phone' => '01712345678',
            'customer_email' => 'alice@test.com',
            'items' => [
                [
                    'sale_item_id' => $this->sale->items->first()->id,
                    'quantity' => 1.50,
                    'refund_amount' => 150.00,
                    'restock' => false,
                ]
            ]
        ];

        $response = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->postJson("/api/v1/tenant/sales/{$this->sale->id}/refund", $payload);

        $response->assertStatus(201);

        // Assert customer was registered
        $customer = Customer::where('phone', '01712345678')->first();
        $this->assertNotNull($customer);
        $this->assertEquals('Alice Member', $customer->name);
        $this->assertEquals(150.00, $customer->store_credit_balance);
        $this->assertEquals($customer->id, $this->sale->fresh()->customer_id);
    }
}
