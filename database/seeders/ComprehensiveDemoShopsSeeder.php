<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Role;
use App\Models\RolePage;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ComprehensiveDemoShopsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info("🚀 Seeding 3 Fully Featured Tenant Shops with Themes, Brands, and Products...");

        // 1. Ensure Standard Plans Exist
        $trialPlan = Plan::firstOrCreate(
            ['name' => 'Free Trial Plan'],
            [
                'price' => 0.00,
                'billing_period' => 'monthly',
                'is_active' => true,
                'limits' => [
                    'max_products' => 100,
                    'max_images_per_product' => 3,
                    'max_employees' => 5,
                    'max_categories' => 25,
                    'max_brands' => 50,
                ],
            ]
        );

        $proPlan = Plan::firstOrCreate(
            ['name' => 'Pro Merchant Enterprise Plan'],
            [
                'price' => 49.99,
                'billing_period' => 'monthly',
                'is_active' => true,
                'limits' => [
                    'max_products' => 1000,
                    'max_images_per_product' => 10,
                    'max_employees' => 50,
                    'max_categories' => 100,
                    'max_brands' => 200,
                ],
            ]
        );

        // 2. Ensure Platform Admins Exist
        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@marketplace.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'is_platform_admin' => true,
            ]
        );

        $graceAdmin = User::updateOrCreate(
            ['email' => 'grace@marketplace.com'],
            [
                'name' => 'Grace Admin',
                'password' => Hash::make('password'),
                'is_platform_admin' => true,
                'admin_permissions' => ['admin.shops.index', 'admin.plans.index', 'admin.logs.index'],
            ]
        );

        // 3. Ensure Marketplace Customers Exist
        $customerAlice = User::updateOrCreate(
            ['email' => 'alice@customer.com'],
            [
                'name' => 'Alice Customer',
                'phone' => '01700000001',
                'password' => Hash::make('password'),
            ]
        );

        $customerBob = User::updateOrCreate(
            ['email' => 'bob@customer.com'],
            [
                'name' => 'Bob Customer',
                'phone' => '01700000002',
                'password' => Hash::make('password'),
            ]
        );

        // Standard Manager Permissions
        $standardManagerPermissions = [
            'categories.index', 'brands.index',
            'products.index', 'products.create', 'products.edit', 'products.destroy',
            'employees.index', 'roles.index',
            'settings.general', 'settings.shop', 'settings.subscription',
            'sales.index', 'sales.create',
            'refunds.index', 'customers.index'
        ];

        // =========================================================================
        // SHOP 1: Alpha Electronics & Tech (Theme: 'tech')
        // =========================================================================
        $ownerAlpha = User::updateOrCreate(
            ['email' => 'john@alpha.com'],
            ['name' => 'John Owner', 'password' => Hash::make('password')]
        );

        $shopAlpha = Shop::updateOrCreate(
            ['slug' => 'alpha'],
            [
                'name' => 'Alpha Electronics',
                'subdomain' => 'alpha',
                'custom_domain' => 'alphaelectronics.test',
                'custom_domain_status' => 'verified',
                'theme_slug' => 'tech',
                'theme_config' => [
                    'colors' => [
                        'primary' => '#0284C7',
                        'accent' => '#06B6D4',
                        'header_bg' => '#0F172A',
                        'header_text' => '#F1F5F9',
                        'footer_bg' => '#020617',
                        'footer_text' => '#94A3B8',
                    ],
                    'announcement' => [
                        'enabled' => true,
                        'text' => '⚡ Alpha Mega Tech Fest: Up to 20% cashback on flagship gaming rigs & noise-canceling headphones!',
                        'bg_color' => '#0369A1',
                        'text_color' => '#FFFFFF',
                    ],
                    'hero' => [
                        'headline' => 'Next-Generation Hardware & Digital Gear',
                        'subheadline' => 'Official authorized distributor for Apple, Sony, ASUS ROG, and premium smart devices.',
                        'button_text' => 'Browse Tech Catalog',
                        'button_link' => '#catalog',
                    ],
                ],
                'owner_id' => $ownerAlpha->id,
                'status' => 'active',
                'currency' => 'USD',
                'language' => 'en',
                'phone' => '+1-555-0199',
                'email' => 'support@alpha.com',
                'address' => '742 Evergreen Terrace, Silicon Valley, CA',
            ]
        );

        // Alpha Subscription & Roles
        Subscription::firstOrCreate(
            ['shop_id' => $shopAlpha->id, 'plan_id' => $proPlan->id],
            ['status' => 'active', 'starts_at' => now(), 'ends_at' => now()->addYear()]
        );

        $mgrAlpha = Role::firstOrCreate(['shop_id' => $shopAlpha->id, 'name' => 'Manager'], ['is_custom' => false]);
        $workerAlpha = Role::firstOrCreate(['shop_id' => $shopAlpha->id, 'name' => 'Worker'], ['is_custom' => false]);
        foreach ($standardManagerPermissions as $p) {
            RolePage::firstOrCreate(['role_id' => $mgrAlpha->id, 'page_identifier' => $p]);
        }

        // Alpha Employees
        $bobManager = User::updateOrCreate(['email' => 'bob@alpha.com'], ['name' => 'Bob Manager', 'password' => Hash::make('password')]);
        $samSales = User::updateOrCreate(['email' => 'sam@alpha.com'], ['name' => 'Sam Sales', 'password' => Hash::make('password')]);
        $charlieWorker = User::updateOrCreate(['email' => 'charlie@alpha.com'], ['name' => 'Charlie Worker', 'password' => Hash::make('password')]);

        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopAlpha->id, 'user_id' => $bobManager->id],
            ['role_id' => $mgrAlpha->id, 'status' => 'active', 'updated_at' => now()]
        );
        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopAlpha->id, 'user_id' => $samSales->id],
            ['role_id' => $mgrAlpha->id, 'status' => 'active', 'updated_at' => now()]
        );
        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopAlpha->id, 'user_id' => $charlieWorker->id],
            ['role_id' => $workerAlpha->id, 'status' => 'active', 'updated_at' => now()]
        );

        // Alpha Categories & Brands
        $alphaCats = [
            'Smartphones & Mobiles' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopAlpha->id, 'slug' => 'alpha-smartphones'],
                ['name' => 'Smartphones & Mobiles']
            ),
            'Audio & Noise Canceling' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopAlpha->id, 'slug' => 'alpha-audio'],
                ['name' => 'Audio & Noise Canceling']
            ),
            'Gaming & Computing' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopAlpha->id, 'slug' => 'alpha-gaming'],
                ['name' => 'Gaming & Computing']
            ),
            'Smart Watches & Fitness' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopAlpha->id, 'slug' => 'alpha-wearables'],
                ['name' => 'Smart Watches & Fitness']
            ),
        ];

        $alphaBrands = [
            'Apple' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopAlpha->id, 'slug' => 'apple-alpha'], ['name' => 'Apple']),
            'Sony' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopAlpha->id, 'slug' => 'sony-alpha'], ['name' => 'Sony']),
            'ASUS ROG' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopAlpha->id, 'slug' => 'asus-alpha'], ['name' => 'ASUS ROG']),
            'Samsung' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopAlpha->id, 'slug' => 'samsung-alpha'], ['name' => 'Samsung']),
        ];

        // Seed Alpha Products
        $alphaProductsData = [
            [
                'name' => 'iPhone 15 Pro Max 256GB Titanium',
                'cat' => 'Smartphones & Mobiles',
                'brand' => 'Apple',
                'price' => 1199.00,
                'cost' => 950.00,
                'stock' => 25,
                'unit' => 'pcs',
                'image' => 'products/smartwatch.png',
            ],
            [
                'name' => 'Sony WH-1000XM5 Wireless Headphones',
                'cat' => 'Audio & Noise Canceling',
                'brand' => 'Sony',
                'price' => 399.00,
                'cost' => 280.00,
                'stock' => 45,
                'unit' => 'pcs',
                'image' => 'products/earbuds.png',
            ],
            [
                'name' => 'ASUS ROG Zephyrus G16 OLED Gaming Laptop',
                'cat' => 'Gaming & Computing',
                'brand' => 'ASUS ROG',
                'price' => 2299.00,
                'cost' => 1800.00,
                'stock' => 12,
                'unit' => 'pcs',
                'image' => 'products/smartwatch.png',
            ],
            [
                'name' => 'Apple Watch Ultra 2 GPS + Cellular',
                'cat' => 'Smart Watches & Fitness',
                'brand' => 'Apple',
                'price' => 799.00,
                'cost' => 620.00,
                'stock' => 30,
                'unit' => 'pcs',
                'image' => 'products/smartwatch.png',
            ],
            [
                'name' => 'Samsung Galaxy S24 Ultra AI Edition',
                'cat' => 'Smartphones & Mobiles',
                'brand' => 'Samsung',
                'price' => 1299.00,
                'cost' => 990.00,
                'stock' => 20,
                'unit' => 'pcs',
                'image' => 'products/earbuds.png',
            ],
        ];

        foreach ($alphaProductsData as $p) {
            $cat = $alphaCats[$p['cat']];
            $brand = $alphaBrands[$p['brand']];
            $slug = Str::slug($p['name'] . '-alpha');

            $prod = Product::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopAlpha->id, 'slug' => $slug],
                [
                    'category_id' => $cat->id,
                    'brand_id' => $brand->id,
                    'name' => $p['name'],
                    'price' => $p['price'],
                    'cost_price' => $p['cost'],
                    'stock_quantity' => $p['stock'],
                    'stock_unit' => $p['unit'],
                    'status' => 'published',
                    'created_by' => $ownerAlpha->id,
                ]
            );

            ProductImage::firstOrCreate(
                ['shop_id' => $shopAlpha->id, 'product_id' => $prod->id, 'path' => $p['image']],
                ['sort_order' => 1]
            );
        }

        // =========================================================================
        // SHOP 2: Common Grocery (Theme: 'grocery')
        // =========================================================================
        $ownerGrocery = User::updateOrCreate(
            ['email' => 'owner@commongrocery.com'],
            ['name' => 'Karim Chowdhury', 'password' => Hash::make('password')]
        );

        $shopGrocery = Shop::updateOrCreate(
            ['slug' => 'common-grocery'],
            [
                'name' => 'Common Grocery',
                'subdomain' => 'grocery',
                'custom_domain' => 'commongrocery.test',
                'custom_domain_status' => 'verified',
                'theme_slug' => 'grocery',
                'theme_config' => [
                    'colors' => [
                        'primary' => '#16A34A',
                        'accent' => '#F97316',
                        'header_bg' => '#F0FDF4',
                        'header_text' => '#14532D',
                        'footer_bg' => '#064E3B',
                        'footer_text' => '#DCFCE7',
                    ],
                    'announcement' => [
                        'enabled' => true,
                        'text' => '🥦 Same-day farm-fresh groceries delivered to your doorstep in 60 minutes!',
                        'bg_color' => '#15803D',
                        'text_color' => '#FFFFFF',
                    ],
                    'hero' => [
                        'headline' => 'Fresh From Farm to Your Daily Table',
                        'subheadline' => '100% authentic Miniket rice, organic cold-pressed mustard oil, and dairy products.',
                        'button_text' => 'Shop Fresh Market',
                        'button_link' => '#catalog',
                    ],
                ],
                'owner_id' => $ownerGrocery->id,
                'status' => 'active',
                'currency' => 'BDT',
                'language' => 'en',
                'phone' => '+8801711000001',
                'email' => 'orders@commongrocery.com',
                'address' => 'Plot 45, Gulshan-2, Dhaka 1212',
            ]
        );

        Subscription::firstOrCreate(
            ['shop_id' => $shopGrocery->id, 'plan_id' => $proPlan->id],
            ['status' => 'active', 'starts_at' => now(), 'ends_at' => now()->addYear()]
        );

        $mgrGrocery = Role::firstOrCreate(['shop_id' => $shopGrocery->id, 'name' => 'Manager'], ['is_custom' => false]);
        foreach ($standardManagerPermissions as $p) {
            RolePage::firstOrCreate(['role_id' => $mgrGrocery->id, 'page_identifier' => $p]);
        }

        $groceryMgrUser = User::updateOrCreate(['email' => 'manager@commongrocery.com'], ['name' => 'Grocery Manager', 'password' => Hash::make('password')]);
        $groceryCashier = User::updateOrCreate(['email' => 'cashier@commongrocery.com'], ['name' => 'Grocery Cashier', 'password' => Hash::make('password')]);

        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopGrocery->id, 'user_id' => $groceryMgrUser->id],
            ['role_id' => $mgrGrocery->id, 'status' => 'active', 'updated_at' => now()]
        );
        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopGrocery->id, 'user_id' => $groceryCashier->id],
            ['role_id' => $mgrGrocery->id, 'status' => 'active', 'updated_at' => now()]
        );

        $groceryCats = [
            'Rice & Grains' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopGrocery->id, 'slug' => 'grocery-rice'],
                ['name' => 'Rice & Grains']
            ),
            'Cooking Oils & Ghee' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopGrocery->id, 'slug' => 'grocery-oils'],
                ['name' => 'Cooking Oils & Ghee']
            ),
            'Spices & Masala' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopGrocery->id, 'slug' => 'grocery-spices'],
                ['name' => 'Spices & Masala']
            ),
            'Dairy & Farm Eggs' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopGrocery->id, 'slug' => 'grocery-dairy'],
                ['name' => 'Dairy & Farm Eggs']
            ),
        ];

        $groceryBrands = [
            'Teer' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopGrocery->id, 'slug' => 'teer-grocery'], ['name' => 'Teer']),
            'Radhuni' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopGrocery->id, 'slug' => 'radhuni-grocery'], ['name' => 'Radhuni']),
            'Pran' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopGrocery->id, 'slug' => 'pran-grocery'], ['name' => 'Pran']),
            'Aarong Dairy' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopGrocery->id, 'slug' => 'aarong-grocery'], ['name' => 'Aarong Dairy']),
        ];

        $groceryProductsData = [
            [
                'name' => 'Teer Premium Nazirshail Rice 50kg Sack',
                'cat' => 'Rice & Grains',
                'brand' => 'Teer',
                'price' => 3850.00,
                'cost' => 3450.00,
                'stock' => 150,
                'unit' => 'kg',
                'image' => 'products/smartwatch.png',
            ],
            [
                'name' => 'Radhuni Pure Mustard Oil 1 Liter',
                'cat' => 'Cooking Oils & Ghee',
                'brand' => 'Radhuni',
                'price' => 360.00,
                'cost' => 310.00,
                'stock' => 200,
                'unit' => 'liter',
                'image' => 'products/earbuds.png',
            ],
            [
                'name' => 'Radhuni Pure Turmeric Powder 500g',
                'cat' => 'Spices & Masala',
                'brand' => 'Radhuni',
                'price' => 220.00,
                'cost' => 180.00,
                'stock' => 300,
                'unit' => 'pcs',
                'image' => 'products/smartwatch.png',
            ],
            [
                'name' => 'Aarong Dairy Pure Ghee 900g Jar',
                'cat' => 'Dairy & Farm Eggs',
                'brand' => 'Aarong Dairy',
                'price' => 1650.00,
                'cost' => 1400.00,
                'stock' => 80,
                'unit' => 'pcs',
                'image' => 'products/earbuds.png',
            ],
            [
                'name' => 'Pran Daily Brown Farm Eggs (30 pcs)',
                'cat' => 'Dairy & Farm Eggs',
                'brand' => 'Pran',
                'price' => 450.00,
                'cost' => 390.00,
                'stock' => 120,
                'unit' => 'pcs',
                'image' => 'products/smartwatch.png',
            ],
        ];

        foreach ($groceryProductsData as $p) {
            $cat = $groceryCats[$p['cat']];
            $brand = $groceryBrands[$p['brand']];
            $slug = Str::slug($p['name'] . '-grocery');

            $prod = Product::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopGrocery->id, 'slug' => $slug],
                [
                    'category_id' => $cat->id,
                    'brand_id' => $brand->id,
                    'name' => $p['name'],
                    'price' => $p['price'],
                    'cost_price' => $p['cost'],
                    'stock_quantity' => $p['stock'],
                    'stock_unit' => $p['unit'],
                    'status' => 'published',
                    'created_by' => $ownerGrocery->id,
                ]
            );

            ProductImage::firstOrCreate(
                ['shop_id' => $shopGrocery->id, 'product_id' => $prod->id, 'path' => $p['image']],
                ['sort_order' => 1]
            );
        }

        // =========================================================================
        // SHOP 3: Velvet Couture & Boutique (Theme: 'boutique')
        // =========================================================================
        $ownerBoutique = User::updateOrCreate(
            ['email' => 'owner@boutique.com'],
            ['name' => 'Sarah Sterling', 'password' => Hash::make('password')]
        );

        $shopBoutique = Shop::updateOrCreate(
            ['slug' => 'boutique'],
            [
                'name' => 'Velvet Couture',
                'subdomain' => 'boutique',
                'custom_domain' => 'velvetcouture.test',
                'custom_domain_status' => 'verified',
                'theme_slug' => 'boutique',
                'theme_config' => [
                    'colors' => [
                        'primary' => '#9333EA',
                        'accent' => '#D97706',
                        'header_bg' => '#FAF5FF',
                        'header_text' => '#581C87',
                        'footer_bg' => '#2E1065',
                        'footer_text' => '#F3E8FF',
                    ],
                    'announcement' => [
                        'enabled' => true,
                        'text' => '✨ Haute Couture Spring Collection: Complimentary bespoke tailoring on all signature gowns & blazers.',
                        'bg_color' => '#6B21A8',
                        'text_color' => '#FFFFFF',
                    ],
                    'hero' => [
                        'headline' => 'Artisan Tailoring Meets Haute Couture',
                        'subheadline' => 'Handwoven fabrics, bespoke occasion wear, and handcrafted Italian leather footwear.',
                        'button_text' => 'View Lookbook',
                        'button_link' => '#catalog',
                    ],
                ],
                'owner_id' => $ownerBoutique->id,
                'status' => 'active',
                'currency' => 'EUR',
                'language' => 'en',
                'phone' => '+33 1 42 68 55 00',
                'email' => 'concierge@boutique.com',
                'address' => '24 Rue du Faubourg Saint-Honoré, 75008 Paris, France',
            ]
        );

        Subscription::firstOrCreate(
            ['shop_id' => $shopBoutique->id, 'plan_id' => $proPlan->id],
            ['status' => 'active', 'starts_at' => now(), 'ends_at' => now()->addYear()]
        );

        $mgrBoutique = Role::firstOrCreate(['shop_id' => $shopBoutique->id, 'name' => 'Manager'], ['is_custom' => false]);
        foreach ($standardManagerPermissions as $p) {
            RolePage::firstOrCreate(['role_id' => $mgrBoutique->id, 'page_identifier' => $p]);
        }

        $boutiqueMgrUser = User::updateOrCreate(['email' => 'manager@boutique.com'], ['name' => 'Boutique Manager', 'password' => Hash::make('password')]);
        $boutiqueStylist = User::updateOrCreate(['email' => 'stylist@boutique.com'], ['name' => 'Lead Stylist', 'password' => Hash::make('password')]);

        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopBoutique->id, 'user_id' => $boutiqueMgrUser->id],
            ['role_id' => $mgrBoutique->id, 'status' => 'active', 'updated_at' => now()]
        );
        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopBoutique->id, 'user_id' => $boutiqueStylist->id],
            ['role_id' => $mgrBoutique->id, 'status' => 'active', 'updated_at' => now()]
        );

        $boutiqueCats = [
            'Bespoke Evening Gowns' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopBoutique->id, 'slug' => 'boutique-gowns'],
                ['name' => 'Bespoke Evening Gowns']
            ),
            'Luxury Silk Sarees' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopBoutique->id, 'slug' => 'boutique-sarees'],
                ['name' => 'Luxury Silk Sarees']
            ),
            'Handmade Italian Shoes' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopBoutique->id, 'slug' => 'boutique-shoes'],
                ['name' => 'Handmade Italian Shoes']
            ),
            'Artisan Leather Bags' => Category::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopBoutique->id, 'slug' => 'boutique-bags'],
                ['name' => 'Artisan Leather Bags']
            ),
        ];

        $boutiqueBrands = [
            'Velvet Atelier' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopBoutique->id, 'slug' => 'velvet-atelier'], ['name' => 'Velvet Atelier']),
            'Silk Route Paris' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopBoutique->id, 'slug' => 'silk-route-paris'], ['name' => 'Silk Route Paris']),
            'Aurelia Handcrafted' => Brand::withoutGlobalScopes()->updateOrCreate(['shop_id' => $shopBoutique->id, 'slug' => 'aurelia-boutique'], ['name' => 'Aurelia Handcrafted']),
        ];

        $boutiqueProductsData = [
            [
                'name' => 'Emerald Velvet Embroidered Gala Gown',
                'cat' => 'Bespoke Evening Gowns',
                'brand' => 'Velvet Atelier',
                'price' => 890.00,
                'cost' => 450.00,
                'stock' => 15,
                'unit' => 'pcs',
                'image' => 'products/smartwatch.png',
            ],
            [
                'name' => 'Pure Katan Silk Hand-woven Royal Saree',
                'cat' => 'Luxury Silk Sarees',
                'brand' => 'Silk Route Paris',
                'price' => 650.00,
                'cost' => 320.00,
                'stock' => 20,
                'unit' => 'pcs',
                'image' => 'products/earbuds.png',
            ],
            [
                'name' => 'Florentine Handcrafted Calfskin Oxford Shoes',
                'cat' => 'Handmade Italian Shoes',
                'brand' => 'Aurelia Handcrafted',
                'price' => 420.00,
                'cost' => 210.00,
                'stock' => 35,
                'unit' => 'pair',
                'image' => 'products/smartwatch.png',
            ],
            [
                'name' => 'Milano Mini Structured Leather Tote Bag',
                'cat' => 'Artisan Leather Bags',
                'brand' => 'Velvet Atelier',
                'price' => 540.00,
                'cost' => 260.00,
                'stock' => 22,
                'unit' => 'pcs',
                'image' => 'products/earbuds.png',
            ],
        ];

        foreach ($boutiqueProductsData as $p) {
            $cat = $boutiqueCats[$p['cat']];
            $brand = $boutiqueBrands[$p['brand']];
            $slug = Str::slug($p['name'] . '-boutique');

            $prod = Product::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopBoutique->id, 'slug' => $slug],
                [
                    'category_id' => $cat->id,
                    'brand_id' => $brand->id,
                    'name' => $p['name'],
                    'price' => $p['price'],
                    'cost_price' => $p['cost'],
                    'stock_quantity' => $p['stock'],
                    'stock_unit' => $p['unit'],
                    'status' => 'published',
                    'created_by' => $ownerBoutique->id,
                ]
            );

            ProductImage::firstOrCreate(
                ['shop_id' => $shopBoutique->id, 'product_id' => $prod->id, 'path' => $p['image']],
                ['sort_order' => 1]
            );
        }

        $this->command?->info("✅ Successfully seeded 3 fully populated tenant shops:");
        $this->command?->info("  1. Alpha Electronics (tech theme, 4 categories, 4 brands, 5 products)");
        $this->command?->info("  2. Common Grocery (grocery theme, 4 categories, 4 brands, 5 products with kg/liter)");
        $this->command?->info("  3. Velvet Couture (boutique theme, 4 categories, 3 brands, 4 products)");
    }
}
