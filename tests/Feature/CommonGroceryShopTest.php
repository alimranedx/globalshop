<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use App\Modules\ShopManager\TenantManager;
use Database\Seeders\CommonGrocerySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommonGroceryShopTest extends TestCase
{
    use RefreshDatabase;

    protected Shop $shop;
    protected User $owner;
    protected User $manager;
    protected User $salesman;

    protected function setUp(): void
    {
        parent::setUp();

        // Run the Common Grocery Seeder
        $seeder = new CommonGrocerySeeder();
        $seeder->run();

        $this->shop = Shop::where('slug', 'common-grocery')->firstOrFail();
        $this->owner = User::where('email', 'owner@commongrocery.com')->firstOrFail();
        $this->manager = User::where('email', 'manager@commongrocery.com')->firstOrFail();
        $this->salesman = User::where('email', 'salesman@commongrocery.com')->firstOrFail();
    }

    public function test_common_grocery_shop_is_active_with_bdt_currency(): void
    {
        $this->assertEquals('Common Grocery', $this->shop->name);
        $this->assertEquals('active', $this->shop->status);
        $this->assertEquals('BDT', $this->shop->currency);
        $this->assertEquals($this->owner->id, $this->shop->owner_id);
    }

    public function test_common_grocery_has_at_least_10_categories_20_brands_50_products(): void
    {
        TenantManager::setTenant($this->shop);

        $catCount = Category::count();
        $brandCount = Brand::count();
        $prodCount = Product::count();

        $this->assertGreaterThanOrEqual(10, $catCount, "Should have at least 10 categories, found: {$catCount}");
        $this->assertGreaterThanOrEqual(20, $brandCount, "Should have at least 20 brands, found: {$brandCount}");
        $this->assertGreaterThanOrEqual(50, $prodCount, "Should have at least 50 products, found: {$prodCount}");
    }

    public function test_common_grocery_products_have_standard_stock_units(): void
    {
        TenantManager::setTenant($this->shop);

        $units = Product::pluck('stock_unit')->unique()->values()->toArray();

        $this->assertContains('kg', $units);
        $this->assertContains('ltr', $units);
        $this->assertContains('ml', $units);
        $this->assertContains('g', $units);
        $this->assertContains('pcs', $units);
        $this->assertContains('pack', $units);
        $this->assertContains('dozen', $units);
        $this->assertContains('box', $units);
    }

    public function test_manager_can_access_catalog_and_sales(): void
    {
        $this->actingAs($this->manager);

        $resCategories = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->getJson('/api/v1/tenant/categories');
        $resCategories->assertStatus(200);

        $resBrands = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->getJson('/api/v1/tenant/brands');
        $resBrands->assertStatus(200);

        $resProducts = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->getJson('/api/v1/tenant/products');
        $resProducts->assertStatus(200);

        $resSales = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->getJson('/api/v1/tenant/sales');
        $resSales->assertStatus(200);
    }

    public function test_salesman_can_access_pos_sales_but_not_employees(): void
    {
        $this->actingAs($this->salesman);

        $resProducts = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->getJson('/api/v1/tenant/products');
        $resProducts->assertStatus(200);

        $resSales = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->getJson('/api/v1/tenant/sales');
        $resSales->assertStatus(200);

        // Cannot manage employees
        $resEmployees = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->getJson('/api/v1/tenant/employees');
        $resEmployees->assertStatus(403);
    }

    public function test_sale_decrements_stock_properly_for_kg_and_dozen_and_ltr(): void
    {
        TenantManager::setTenant($this->shop);

        $rice = Product::where('slug', 'chashi-chinigura-rice-1kg')->firstOrFail();
        $oil = Product::where('slug', 'teer-soybean-oil-5l')->firstOrFail();
        $eggs = Product::where('slug', 'kazi-farms-brown-eggs-1dozen')->firstOrFail();
        $soap = Product::where('slug', 'lux-soft-rose-soap-100g')->firstOrFail();

        $initialRiceStock = $rice->stock_quantity;
        $initialOilStock = $oil->stock_quantity;
        $initialEggsStock = $eggs->stock_quantity;
        $initialSoapStock = $soap->stock_quantity;

        $this->actingAs($this->salesman);

        $response = $this->withHeaders(['X-Tenant-ID' => $this->shop->id])
            ->postJson('/api/v1/tenant/sales', [
                'customer_name' => 'Abdur Razzaq',
                'customer_phone' => '01812345678',
                'payment_method' => 'cash',
                'discount' => 20.00,
                'items' => [
                    ['product_id' => $rice->id, 'quantity' => 2.5], // 2.5 kg
                    ['product_id' => $oil->id, 'quantity' => 1.0],  // 1 bottle (5L)
                    ['product_id' => $eggs->id, 'quantity' => 2.0], // 2 dozen
                    ['product_id' => $soap->id, 'quantity' => 3.0], // 3 pcs
                ],
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);

        // Verify stock decrements
        $this->assertEquals($initialRiceStock - 2.5, $rice->fresh()->stock_quantity);
        $this->assertEquals($initialOilStock - 1.0, $oil->fresh()->stock_quantity);
        $this->assertEquals($initialEggsStock - 2.0, $eggs->fresh()->stock_quantity);
        $this->assertEquals($initialSoapStock - 3.0, $soap->fresh()->stock_quantity);

        // Verify sale record and items
        $saleId = $response->json('data.id');
        $sale = Sale::with('items')->findOrFail($saleId);
        $this->assertCount(4, $sale->items);
        $this->assertEquals('Abdur Razzaq', $sale->customer_name);
        $this->assertEquals('cash', $sale->payment_method);
    }
}
