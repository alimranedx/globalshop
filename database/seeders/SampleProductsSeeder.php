<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Shop;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Support\Str;

class SampleProductsSeeder extends Seeder
{
    public function run()
    {
        $shop = Shop::first();
        if (!$shop) return;

        $user = \App\Models\User::first();
        $userId = $user ? $user->id : null;

        $category = Category::first();
        $brand = Brand::first();

        // 1. Smartwatch
        $prod1 = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $category ? $category->id : null,
            'brand_id' => $brand ? $brand->id : null,
            'name' => 'Smartwatch Pro X',
            'slug' => 'smartwatch-pro-x-' . Str::random(4),
            'description' => 'A premium smartwatch with heart rate monitoring, fitness tracking, and a gorgeous AMOLED screen.',
            'price' => 199.99,
            'cost_price' => 120.00,
            'stock_quantity' => 50,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        ProductImage::create([
            'shop_id' => $shop->id,
            'product_id' => $prod1->id,
            'path' => 'products/smartwatch.png',
            'sort_order' => 1,
        ]);

        // 2. Earbuds
        $prod2 = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $category ? $category->id : null,
            'brand_id' => $brand ? $brand->id : null,
            'name' => 'Acoustic Wireless Buds',
            'slug' => 'acoustic-wireless-buds-' . Str::random(4),
            'description' => 'Active noise cancelling wireless earbuds with deep bass and up to 40 hours of playback time.',
            'price' => 89.99,
            'cost_price' => 45.00,
            'stock_quantity' => 75,
            'stock_unit' => 'pcs',
            'status' => 'published',
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        ProductImage::create([
            'shop_id' => $shop->id,
            'product_id' => $prod2->id,
            'path' => 'products/earbuds.png',
            'sort_order' => 1,
        ]);
    }
}
