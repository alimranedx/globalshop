<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Shop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductionMockDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get Shop Alpha info
        $shop = Shop::where('slug', 'alpha')->first();
        if (!$shop) {
            $shop = Shop::first();
        }
        if (!$shop) {
            $this->command->error('No shops found to seed mock data. Please run reset first.');
            return;
        }

        $shopId = $shop->id;
        $ownerId = $shop->owner_id;

        $this->command->info("Clearing old categories, brands, products, images, and sales context...");

        // 2. Truncate target tables safely
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \App\Models\SaleItem::truncate();
        \App\Models\Sale::truncate();
        ProductImage::truncate();
        Product::truncate();
        Brand::truncate();
        Category::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 3. Prepare placeholder logo files in public storage
        $logoPath = 'logos/placeholder.png';
        if (!Storage::disk('public')->exists($logoPath)) {
            // Copy smartwatch or earbuds image to serve as a high-quality logo placeholder
            if (Storage::disk('public')->exists('products/smartwatch.png')) {
                Storage::disk('public')->copy('products/smartwatch.png', $logoPath);
            } elseif (Storage::disk('public')->exists('products/earbuds.png')) {
                Storage::disk('public')->copy('products/earbuds.png', $logoPath);
            } else {
                // If storage is empty, write a dummy file
                Storage::disk('public')->put($logoPath, 'dummy logo content');
            }
        }

        // 4. Seed 20 Categories (shop_id: 1)
        $categoryNames = [
            'Smartphones & Devices', 'Laptops & Computers', 'Audio & Music', 'Home Entertainment',
            'Kitchen & Dining', 'Smart Home Tech', 'Wearables & Watches', 'Sports & Fitness',
            'Outdoor & Camping', 'Men\'s Fashion', 'Women\'s Apparel', 'Kids & Baby Wear',
            'Shoes & Footwear', 'Health & Beauty', 'Office & Stationery', 'Home & Furniture',
            'Automotives', 'Travel & Luggage', 'Books & Hobbies', 'Pet Accessories'
        ];

        $categories = [];
        foreach ($categoryNames as $index => $name) {
            $categories[] = Category::withoutGlobalScopes()->create([
                'shop_id' => $shopId,
                'name' => $name,
                'slug' => Str::slug($name) . '-' . Str::random(4),
                'logo_path' => $logoPath,
            ]);
        }

        // 5. Seed 30 Brands (shop_id: 1)
        $brandNames = [
            'ApexTech', 'Bolt', 'Chrono', 'Dynamo', 'Eclipse', 'Flux', 'Glide', 'Halo',
            'Infinity', 'Nova', 'Onyx', 'Pulse', 'Quantum', 'Rift', 'Summit', 'Titan',
            'Ultra', 'Vector', 'Wave', 'Zenith', 'Aero', 'Byte', 'Core', 'Drift',
            'Edge', 'Fuse', 'Grid', 'Hyper', 'Ion', 'Nexus'
        ];

        $brands = [];
        foreach ($brandNames as $index => $name) {
            $associatedCat = $categories[$index % count($categories)];
            $brands[] = Brand::withoutGlobalScopes()->create([
                'shop_id' => $shopId,
                'category_id' => $associatedCat->id,
                'name' => $name,
                'slug' => Str::slug($name) . '-' . Str::random(4),
                'logo_path' => $logoPath,
            ]);
        }

        // 6. Seed 50 Products
        $this->command->info("Seeding 50 products with images...");
        for ($i = 1; $i <= 50; $i++) {
            $cat = $categories[$i % count($categories)];
            $brand = $brands[$i % count($brands)];

            $price = round(rand(120, 14900) / 10, 2);
            $costPrice = round($price * 0.62, 2);

            $prod = Product::withoutGlobalScopes()->create([
                'shop_id' => $shopId,
                'category_id' => $cat->id,
                'brand_id' => $brand->id,
                'name' => "{$brand->name} {$cat->name} Series " . chr(65 + ($i % 26)),
                'slug' => Str::slug("{$brand->name}-{$cat->name}-series-{$i}") . '-' . Str::random(4),
                'description' => "Experience premium utility with the {$brand->name} {$cat->name} Series. Meticulously designed, reliable, and perfectly integrated into your lifestyle.",
                'price' => $price,
                'cost_price' => $costPrice,
                'stock_quantity' => rand(25, 120),
                'stock_unit' => 'pcs',
                'status' => 'published',
                'created_by' => $ownerId,
                'updated_by' => $ownerId,
            ]);

            // Odd products get 2 images, even products get 1 image
            if ($i % 2 === 1) {
                // Multiple images
                ProductImage::create([
                    'shop_id' => $shopId,
                    'product_id' => $prod->id,
                    'path' => 'products/smartwatch.png',
                    'sort_order' => 1,
                ]);
                ProductImage::create([
                    'shop_id' => $shopId,
                    'product_id' => $prod->id,
                    'path' => 'products/earbuds.png',
                    'sort_order' => 2,
                ]);
            } else {
                // Single image
                $path = ($i % 4 === 0) ? 'products/smartwatch.png' : 'products/earbuds.png';
                ProductImage::create([
                    'shop_id' => $shopId,
                    'product_id' => $prod->id,
                    'path' => $path,
                    'sort_order' => 1,
                ]);
            }
        }

        $this->command->info("✅ Successfully seeded 20 categories, 30 brands, and 50 products!");
    }
}
