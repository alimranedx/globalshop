<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogTestSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::where('slug', 'alpha')->firstOrFail();
        $shopId  = $shop->id;
        $ownerId = $shop->owner_id;

        // ──────────────────────────────────────────────
        // 24 Categories (shop-scoped, bypassing global scope)
        // ──────────────────────────────────────────────
        $categoryNames = [
            'Electronics',       'Mobile Phones',     'Laptops & Computers',
            'Audio & Headphones','Cameras & Optics',  'Home Appliances',
            'Kitchen Gadgets',   'Furniture',         'Clothing & Apparel',
            'Men\'s Wear',       'Women\'s Wear',     'Kids Fashion',
            'Footwear',          'Sports & Fitness',  'Outdoor & Camping',
            'Books & Education', 'Toys & Games',      'Health & Beauty',
            'Personal Care',     'Grocery & Food',    'Beverages',
            'Automotive',        'Office Supplies',   'Pet Accessories',
        ];

        $categoryIds = [];
        foreach ($categoryNames as $name) {
            $slug = Str::slug($name) . '-' . Str::random(4);
            $category = Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopId, 'name' => $name],
                ['slug' => $slug]
            );
            $categoryIds[] = $category->id;
        }

        // ──────────────────────────────────────────────
        // 24 Brands (shop-scoped, bypassing tenant scope)
        // ──────────────────────────────────────────────
        $brandNames = [
            'Samsung',     'Apple',        'Sony',
            'LG',          'Philips',      'Bosch',
            'Dell',        'HP',           'Lenovo',
            'Nike',        'Adidas',       'Puma',
            'Reebok',      'Panasonic',    'Canon',
            'Nikon',       'Unilever',     'Nestlé',
            'Coca-Cola',   'PepsiCo',      'Toyota',
            'Honda',       'Xiaomi',       'OnePlus',
        ];

        $brandIds = [];
        foreach ($brandNames as $name) {
            $slug = Str::slug($name) . '-' . Str::random(4);
            $brand = Brand::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopId, 'name' => $name],
                ['slug' => $slug]
            );
            $brandIds[] = $brand->id;
        }

        // ──────────────────────────────────────────────
        // 24 Products spread across categories & brands
        // ──────────────────────────────────────────────
        $products = [
            ['Samsung Galaxy S24 Ultra',   $categoryIds[1],  $brandIds[0],  'pcs',  49,   1299.99],
            ['Apple iPhone 16 Pro',        $categoryIds[1],  $brandIds[1],  'pcs',  30,   1399.00],
            ['Sony WH-1000XM5 Headphones', $categoryIds[3],  $brandIds[2],  'pcs',  75,    349.99],
            ['LG OLED 55" TV',             $categoryIds[0],  $brandIds[3],  'pcs',  20,    899.00],
            ['Philips Air Fryer',          $categoryIds[6],  $brandIds[4],  'pcs',  60,    149.95],
            ['Bosch Washing Machine',      $categoryIds[5],  $brandIds[5],  'pcs',  15,    749.00],
            ['Dell XPS 15 Laptop',         $categoryIds[2],  $brandIds[6],  'pcs',  25,   1549.99],
            ['HP LaserJet Printer',        $categoryIds[22], $brandIds[7],  'pcs',  40,    299.00],
            ['Lenovo ThinkPad X1',         $categoryIds[2],  $brandIds[8],  'pcs',  18,   1799.00],
            ['Nike Air Max 270',           $categoryIds[12], $brandIds[9],  'pcs', 120,    150.00],
            ['Adidas Ultraboost 22',       $categoryIds[12], $brandIds[10], 'pcs',  90,    180.00],
            ['Puma Running Shorts',        $categoryIds[13], $brandIds[11], 'pcs', 200,     35.99],
            ['Reebok Training Shoes',      $categoryIds[12], $brandIds[12], 'pcs',  80,    110.00],
            ['Panasonic Microwave',        $categoryIds[6],  $brandIds[13], 'pcs',  35,    199.00],
            ['Canon EOS R6 Camera',        $categoryIds[4],  $brandIds[14], 'pcs',  12,   2499.00],
            ['Nikon Z50 Mirrorless',       $categoryIds[4],  $brandIds[15], 'pcs',  10,   1099.00],
            ['Dove Shampoo 500ml',         $categoryIds[17], $brandIds[16], 'ltr', 500,      5.99],
            ['Nescafé Gold 200g',          $categoryIds[20], $brandIds[17], 'kg',   80,     12.49],
            ['Coca-Cola 2L Bottle',        $categoryIds[20], $brandIds[18], 'ltr', 250,      2.99],
            ['Pepsi Max 1.5L',             $categoryIds[20], $brandIds[19], 'ltr', 300,      2.49],
            ['Toyota Branded Car Freshner', $categoryIds[21], $brandIds[20], 'pcs', 500,     4.99],
            ['Honda Engine Oil 5L',        $categoryIds[21], $brandIds[21], 'ltr',  60,     32.00],
            ['Xiaomi Redmi Note 13',       $categoryIds[1],  $brandIds[22], 'pcs',  55,    249.99],
            ['OnePlus 12 Pro',             $categoryIds[1],  $brandIds[23], 'pcs',  40,    799.00],
        ];

        $statuses = ['published', 'published', 'published', 'draft', 'archived'];

        foreach ($products as $i => [$name, $categoryId, $brandId, $unit, $stock, $price]) {
            $slug = Str::slug($name) . '-' . Str::random(4);
            Product::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopId, 'name' => $name],
                [
                    'slug'           => $slug,
                    'category_id'    => $categoryId,
                    'brand_id'       => $brandId,
                    'description'    => "High-quality {$name} — perfect for everyday use.",
                    'price'          => $price,
                    'stock_quantity' => $stock,
                    'stock_unit'     => $unit,
                    'status'         => $statuses[$i % count($statuses)],
                    'created_by'     => $ownerId,
                    'updated_by'     => $ownerId,
                ]
            );
        }

        $this->command->info('✅  Seeded 24 categories, 24 brands, and 24 products for Shop Alpha.');
    }
}
