<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Modules\ShopManager\Actions\RegisterShopAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockUnitTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;
    private Category $category;

    protected function setUp(): void
    {
        TenantManager::setTenant(null);

        parent::setUp();

        $plan = Plan::create([
            'name' => 'Trial Plan',
            'price' => 0.00,
            'limits' => [
                'max_products' => 100,
                'max_images_per_product' => 5,
                'max_employees' => 5,
            ],
        ]);

        $registrar = resolve(RegisterShopAction::class);
        $this->shop = $registrar->execute(
            ['name' => 'Stock Unit Shop', 'slug' => 'stock-unit-shop'],
            ['name' => 'Unit Owner', 'email' => 'unitowner@test.com', 'password' => 'password'],
            $plan->id,
            'active'
        );

        $this->owner = User::where('email', 'unitowner@test.com')->first();

        $this->category = Category::create([
            'shop_id' => $this->shop->id,
            'name' => 'Electronics',
            'slug' => 'electronics',
        ]);
    }

    public function test_can_fetch_stock_units_list(): void
    {
        TenantManager::setTenant($this->shop);
        $response = $this->actingAs($this->owner)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->getJson('/api/v1/tenant/stock-units');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonFragment(['id' => 'pcs', 'name' => 'PCS — Pieces'])
            ->assertJsonFragment(['id' => 'kg', 'name' => 'KG — Kilogram'])
            ->assertJsonFragment(['id' => 'box', 'name' => 'BOX — Box']);
    }

    public function test_can_create_product_with_valid_stock_units(): void
    {
        TenantManager::setTenant($this->shop);
        $units = ['pcs', 'kg', 'g', 'ltr', 'ml', 'm', 'cm', 'box', 'pack', 'set', 'pair', 'dozen'];

        foreach ($units as $unit) {
            $response = $this->actingAs($this->owner)
                ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
                ->postJson('/api/v1/tenant/products', [
                    'category_id' => $this->category->id,
                    'name' => 'Product Unit ' . strtoupper($unit),
                    'price' => 29.99,
                    'stock_quantity' => 100,
                    'stock_unit' => $unit,
                    'status' => 'published',
                ]);

            $response->assertStatus(201)
                ->assertJsonPath('data.stock_unit', $unit);

            $this->assertDatabaseHas('products', [
                'shop_id' => $this->shop->id,
                'name' => 'Product Unit ' . strtoupper($unit),
                'stock_unit' => $unit,
            ]);
        }
    }

    public function test_cannot_create_product_with_invalid_stock_unit(): void
    {
        TenantManager::setTenant($this->shop);
        $response = $this->actingAs($this->owner)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->postJson('/api/v1/tenant/products', [
                'category_id' => $this->category->id,
                'name' => 'Product Invalid Unit',
                'price' => 19.99,
                'stock_quantity' => 50,
                'stock_unit' => 'invalid_random_unit',
                'status' => 'published',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock_unit']);
    }

    public function test_can_update_product_stock_unit(): void
    {
        TenantManager::setTenant($this->shop);
        $product = Product::create([
            'shop_id' => $this->shop->id,
            'category_id' => $this->category->id,
            'name' => 'Editable Product',
            'slug' => 'editable-product',
            'price' => 49.99,
            'stock_quantity' => 20,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'created_by' => $this->owner->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->putJson('/api/v1/tenant/products/' . $product->id, [
                'stock_unit' => 'box',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.stock_unit', 'box');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_unit' => 'box',
        ]);
    }
}
