<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogExtraSeeder extends Seeder
{
    public function run(): void
    {
        $shop    = Shop::where('slug', 'alpha')->firstOrFail();
        $shopId  = $shop->id;
        $ownerId = $shop->owner_id;

        // ── Extra 14 Categories ────────────────────────────────────────
        $extraCategories = [
            'Smart Home',       'Gaming & Consoles',  'Wearables & Watches',
            'Baby & Maternity', 'Art & Craft',        'Musical Instruments',
            'Travel & Luggage', 'Garden & Plants',    'DIY & Hardware Tools',
            'Lighting & Lamps', 'Stationery',         'Party Supplies',
            'Cleaning Products','Medical Equipment',
        ];

        $categoryIds = [];
        // Reload existing category IDs
        foreach (Category::withoutGlobalScopes()->where('shop_id', $shopId)->get() as $cat) {
            $categoryIds[$cat->name] = $cat->id;
        }

        foreach ($extraCategories as $name) {
            $existing = Category::withoutGlobalScopes()
                ->where('shop_id', $shopId)
                ->where('name', $name)
                ->first();
            if (!$existing) {
                $cat = Category::withoutGlobalScopes()->create([
                    'shop_id' => $shopId,
                    'name'    => $name,
                    'slug'    => Str::slug($name) . '-' . Str::random(4),
                ]);
                $categoryIds[$name] = $cat->id;
            } else {
                $categoryIds[$name] = $existing->id;
            }
        }

        // ── Extra 16 Brands ────────────────────────────────────────────
        $extraBrands = [
            'Microsoft',    'Google',    'Huawei',   'Oppo',
            'Vivo',         'Realme',    'Asus',     'Acer',
            'Toshiba',      'Sharp',     'Hitachi',  'Whirlpool',
            'Kenwood',      'Bose',      'JBL',      'Beats',
        ];

        $brandIds = [];
        foreach (Brand::withoutGlobalScopes()->where('shop_id', $shopId)->get() as $brand) {
            $brandIds[$brand->name] = $brand->id;
        }

        foreach ($extraBrands as $name) {
            $existing = Brand::withoutGlobalScopes()
                ->where('shop_id', $shopId)
                ->where('name', $name)
                ->first();
            if (!$existing) {
                $brand = Brand::withoutGlobalScopes()->create([
                    'shop_id' => $shopId,
                    'name'    => $name,
                    'slug'    => Str::slug($name) . '-' . Str::random(4),
                ]);
                $brandIds[$name] = $brand->id;
            } else {
                $brandIds[$name] = $existing->id;
            }
        }

        // Grab all category & brand IDs as indexed arrays
        $allCategoryIds = array_values($categoryIds);
        $allBrandIds    = array_values($brandIds);

        // ── Extra 15 Products ──────────────────────────────────────────
        $extraProducts = [
            ['Microsoft Surface Pro 9',      'pcs',  22,   1299.00],
            ['Google Pixel 8 Pro',           'pcs',  35,    999.00],
            ['Huawei MatePad Pro',           'pcs',  40,    699.00],
            ['Oppo Find X6 Pro',             'pcs',  50,    899.00],
            ['Vivo X90 Pro',                 'pcs',  45,    799.00],
            ['Realme GT 5 Pro',              'pcs',  60,    499.00],
            ['Asus ROG Phone 7',             'pcs',  28,   1099.00],
            ['Acer Nitro 5 Gaming Laptop',   'pcs',  20,    849.00],
            ['Toshiba Smart Refrigerator',   'pcs',   8,   1199.00],
            ['Sharp Air Conditioner 1.5T',   'pcs',  12,    599.00],
            ['Hitachi Power Drill 800W',     'pcs', 150,     89.00],
            ['Whirlpool Dishwasher',         'pcs',  10,    549.00],
            ['Kenwood Chef Kitchen Machine', 'pcs',  30,    399.00],
            ['Bose QuietComfort 45',         'pcs',  55,    329.00],
            ['JBL Flip 6 Speaker',           'pcs',  90,    129.99],
            ['Beats Studio Pro',             'pcs',  65,    349.99],
            ['Laundry Liquid Detergent 5L',  'ltr', 200,     18.50],
            ['Extra Virgin Olive Oil 3L',    'ltr',  80,     24.99],
            ['Protein Powder 2kg',           'kg',   40,     59.99],
            ['Basmati Rice 25kg Sack',       'kg',  100,     45.00],
        ];

        $statuses = ['published', 'published', 'published', 'draft', 'archived'];

        foreach ($extraProducts as $i => [$name, $unit, $stock, $price]) {
            $exists = Product::withoutGlobalScopes()
                ->where('shop_id', $shopId)
                ->where('name', $name)
                ->exists();
            if ($exists) continue;

            $catId   = $allCategoryIds[$i % count($allCategoryIds)];
            $brandId = $allBrandIds[$i % count($allBrandIds)];

            Product::withoutGlobalScopes()->create([
                'shop_id'        => $shopId,
                'category_id'    => $catId,
                'brand_id'       => $brandId,
                'name'           => $name,
                'slug'           => Str::slug($name) . '-' . Str::random(4),
                'description'    => "Premium {$name} — trusted by thousands of customers.",
                'price'          => $price,
                'stock_quantity' => $stock,
                'stock_unit'     => $unit,
                'status'         => $statuses[$i % count($statuses)],
                'created_by'     => $ownerId,
                'updated_by'     => $ownerId,
            ]);
        }

        $catCount  = Category::withoutGlobalScopes()->where('shop_id', $shopId)->count();
        $brandCount = Brand::withoutGlobalScopes()->where('shop_id', $shopId)->count();
        $prodCount = Product::withoutGlobalScopes()->where('shop_id', $shopId)->count();

        $this->command->info("✅  Done! Totals → Categories: {$catCount}  Brands: {$brandCount}  Products: {$prodCount}");
    }
}
