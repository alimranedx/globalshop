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

class CommonGrocerySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure high-quota Plan exists for Common Grocery
        $plan = Plan::firstOrCreate(
            ['name' => 'Grocery Superstore Plan'],
            [
                'price' => 29.99,
                'billing_period' => 'monthly',
                'is_active' => true,
                'limits' => [
                    'max_products' => 250,
                    'max_images_per_product' => 4,
                    'max_employees' => 25,
                    'max_categories' => 60,
                    'max_brands' => 120,
                ],
            ]
        );

        // 2. Shop Owner
        $owner = User::updateOrCreate(
            ['email' => 'owner@commongrocery.com'],
            [
                'name' => 'Common Grocery Owner',
                'password' => Hash::make('password'),
            ]
        );

        // 3. Shop: Common Grocery
        $shop = Shop::updateOrCreate(
            ['slug' => 'common-grocery'],
            [
                'name' => 'Common Grocery',
                'owner_id' => $owner->id,
                'domain' => null,
                'status' => 'active',
                'currency' => 'BDT',
                'language' => 'en',
                'phone' => '+8801711000001',
                'address' => 'House 12, Road 5, Dhanmondi',
                'city' => 'Dhaka',
                'country' => 'Bangladesh',
            ]
        );

        $shopId = $shop->id;

        // 4. Subscription
        Subscription::updateOrCreate(
            ['shop_id' => $shopId],
            [
                'plan_id' => $plan->id,
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => now()->addYears(2),
            ]
        );

        // 5. Roles & Permissions
        $managerRole = Role::firstOrCreate(
            ['shop_id' => $shopId, 'name' => 'Manager'],
            ['is_custom' => false]
        );

        $salesmanRole = Role::firstOrCreate(
            ['shop_id' => $shopId, 'name' => 'Salesman'],
            ['is_custom' => true]
        );

        $managerPerms = [
            'categories.index', 'brands.index',
            'products.index', 'products.create', 'products.edit', 'products.destroy',
            'employees.index', 'roles.index',
            'settings.general', 'settings.shop', 'settings.subscription',
            'sales.index', 'sales.create',
            'reports.index', 'inventory.index', 'suppliers.index', 'purchases.index',
        ];

        foreach ($managerPerms as $p) {
            RolePage::firstOrCreate(['role_id' => $managerRole->id, 'page_identifier' => $p]);
        }

        $salesmanPerms = [
            'products.index',
            'sales.index',
            'sales.create',
        ];

        foreach ($salesmanPerms as $p) {
            RolePage::firstOrCreate(['role_id' => $salesmanRole->id, 'page_identifier' => $p]);
        }

        // 6. Employees
        $managerUser = User::updateOrCreate(
            ['email' => 'manager@commongrocery.com'],
            [
                'name' => 'Rahim Manager',
                'password' => Hash::make('password'),
            ]
        );

        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopId, 'user_id' => $managerUser->id],
            [
                'role_id' => $managerRole->id,
                'status' => 'active',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $salesmanUser = User::updateOrCreate(
            ['email' => 'salesman@commongrocery.com'],
            [
                'name' => 'Karim Salesman',
                'password' => Hash::make('password'),
            ]
        );

        DB::table('shop_user')->updateOrInsert(
            ['shop_id' => $shopId, 'user_id' => $salesmanUser->id],
            [
                'role_id' => $salesmanRole->id,
                'status' => 'active',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        // 7. Categories (12 Authentic Bangladeshi Grocery Categories)
        $categoriesDef = [
            'rice-grains' => ['Rice & Grains (চাউল ও খাদ্যশস্য)', 'images/groceries/categories/rice_grains.svg'],
            'edible-oil-ghee' => ['Edible Oil & Ghee (ভোজ্য তেল ও ঘি)', 'images/groceries/categories/edible_oil.svg'],
            'spices-salt-sugar' => ['Spices, Salt & Sugar (মশলা ও লবণ)', 'images/groceries/categories/spices_salt.svg'],
            'dal-pulses' => ['Dal & Pulses (ডাল ও ডালজাতীয়)', 'images/groceries/categories/pulses_dal.svg'],
            'atta-maida-suji' => ['Atta, Maida & Suji (আটা ও ময়দা)', 'images/groceries/categories/flour_atta.svg'],
            'dairy-milk' => ['Dairy & Milk Products (দুধ ও দুগ্ধজাত)', 'images/groceries/categories/dairy_milk.svg'],
            'tea-beverages' => ['Tea, Coffee & Drinks (চা ও পানীয়)', 'images/groceries/categories/tea_beverages.svg'],
            'snacks-biscuits' => ['Snacks, Biscuits & Noodles (স্ন্যাকস ও বিস্কুট)', 'images/groceries/categories/snacks_biscuits.svg'],
            'personal-care' => ['Personal Care & Hygiene (সাবান ও শ্যাম্পু)', 'images/groceries/categories/personal_care.svg'],
            'cleaning-household' => ['Household & Cleaning (হারপিক ও ক্লিনিং)', 'images/groceries/categories/cleaning_household.svg'],
            'bakery-eggs' => ['Bakery, Eggs & Breakfast (ডিম ও বেকারি)', 'images/groceries/categories/bakery_eggs.svg'],
            'baby-food-nutrition' => ['Baby Food & Nutrition (শিশুপণ্য ও খাবার)', 'images/groceries/categories/baby_nutrition.svg'],
        ];

        $categories = [];
        foreach ($categoriesDef as $slug => [$name, $logo]) {
            $cat = Category::withoutGlobalScopes()->where('shop_id', $shopId)->where('slug', $slug)->first();
            if (!$cat) {
                $cat = Category::withoutGlobalScopes()->create([
                    'shop_id' => $shopId,
                    'name' => $name,
                    'slug' => $slug,
                    'logo_path' => $logo,
                ]);
            } else {
                $cat->update(['name' => $name, 'logo_path' => $logo]);
            }
            $categories[$slug] = $cat;
        }

        // 8. Brands (24 Authentic Bangladeshi Brands)
        $brandsDef = [
            'pran' => ['PRAN (প্রাণ)', 'rice-grains', 'images/groceries/brands/pran.svg'],
            'teer' => ['TEER (তীর)', 'edible-oil-ghee', 'images/groceries/brands/teer.svg'],
            'radhuni' => ['RADHUNI (রাঁধুনী)', 'spices-salt-sugar', 'images/groceries/brands/radhuni.svg'],
            'rupchanda' => ['RUPCHANDA (রূপচাঁদা)', 'edible-oil-ghee', 'images/groceries/brands/rupchanda.svg'],
            'aci-pure' => ['ACI PURE (এসিআই পিওর)', 'rice-grains', 'images/groceries/brands/aci_pure.svg'],
            'fresh' => ['FRESH (মেঘনা ফ্রেশ)', 'atta-maida-suji', 'images/groceries/brands/fresh.svg'],
            'aarong-dairy' => ['AARONG DAIRY (আড়ং ডেইরি)', 'dairy-milk', 'images/groceries/brands/aarong_dairy.svg'],
            'dano' => ['DANO (দানো)', 'dairy-milk', 'images/groceries/brands/dano.svg'],
            'ispahani' => ['ISPAHANI (ইস্পাহানি)', 'tea-beverages', 'images/groceries/brands/ispahani.svg'],
            'taaza' => ['TAAZA (তাজা)', 'tea-beverages', 'images/groceries/brands/taaza.svg'],
            'harpic' => ['HARPIC (হারপিক)', 'cleaning-household', 'images/groceries/brands/harpic.svg'],
            'lux' => ['LUX (লাক্স)', 'personal-care', 'images/groceries/brands/lux.svg'],
            'lifebuoy' => ['LIFEBUOY (লাইফবয়)', 'personal-care', 'images/groceries/brands/lifebuoy.svg'],
            'sunsilk' => ['SUNSILK (সানসিল্ক)', 'personal-care', 'images/groceries/brands/sunsilk.svg'],
            'wheel' => ['WHEEL (হুইল)', 'cleaning-household', 'images/groceries/brands/wheel.svg'],
            'rin' => ['RIN (রিন)', 'cleaning-household', 'images/groceries/brands/rin.svg'],
            'maggi' => ['MAGGI (ম্যাগি)', 'snacks-biscuits', 'images/groceries/brands/maggi.svg'],
            'olympic' => ['OLYMPIC (অলিম্পিক)', 'snacks-biscuits', 'images/groceries/brands/olympic.svg'],
            'chashi' => ['CHASHI (চাষী)', 'rice-grains', 'images/groceries/brands/chashi.svg'],
            'molla-salt' => ['MOLLA SALT (মোল্লা সল্ট)', 'spices-salt-sugar', 'images/groceries/brands/molla_salt.svg'],
            'vim' => ['VIM (ভিম)', 'cleaning-household', 'images/groceries/brands/vim.svg'],
            'savlon' => ['SAVLON (স্যাভলন)', 'cleaning-household', 'images/groceries/brands/savlon.svg'],
            'parachute' => ['PARACHUTE (প্যারাস্যুট)', 'personal-care', 'images/groceries/brands/parachute.svg'],
            'kazi-kazi' => ['KAZI & KAZI (কাজী অ্যান্ড কাজী)', 'tea-beverages', 'images/groceries/brands/kazi_kazi.svg'],
        ];

        $brands = [];
        foreach ($brandsDef as $bSlug => [$bName, $catKey, $bLogo]) {
            $brand = Brand::withoutGlobalScopes()->where('shop_id', $shopId)->where('slug', $bSlug)->first();
            $catId = $categories[$catKey]->id ?? null;
            if (!$brand) {
                $brand = Brand::withoutGlobalScopes()->create([
                    'shop_id' => $shopId,
                    'category_id' => $catId,
                    'name' => $bName,
                    'slug' => $bSlug,
                    'logo_path' => $bLogo,
                ]);
            } else {
                $brand->update(['name' => $bName, 'category_id' => $catId, 'logo_path' => $bLogo]);
            }
            $brands[$bSlug] = $brand;
        }

        // 9. Products (54 Bangladeshi Grocery items covering kg, ltr, ml, g, pcs, pack, dozen, box)
        $productsData = [
            // RICE & GRAINS
            ['chashi-chinigura-rice-1kg', 'Chashi Chinigura Aromatic Rice 1kg', 'chashi', 'rice-grains', 'Aromatic premium Chinigura rice for delicious Biryani and Polao.', 160.00, 135.00, 100.0, 'kg', 'images/groceries/products/chashi_chinigura_rice_1kg.svg'],
            ['teer-miniket-rice-5kg', 'Teer Premium Miniket Rice 5kg', 'teer', 'rice-grains', 'Polished, long-grain clean miniket rice for daily family meals.', 380.00, 340.00, 80.0, 'kg', 'images/groceries/products/teer_miniket_rice_5kg.svg'],
            ['aci-pure-nazirshail-rice-5kg', 'ACI Pure Premium Nazirshail Rice 5kg', 'aci-pure', 'rice-grains', 'Selected high quality Nazirshail rice, naturally aged and fluffy.', 410.00, 365.00, 75.0, 'kg', 'images/groceries/products/aci_pure_nazirshail_rice_5kg.svg'],
            ['pran-kalijira-rice-1kg', 'Pran Premium Kalijira Rice 1kg', 'pran', 'rice-grains', 'Fine aromatic small grain Kalijira rice, perfect for Payesh and Firni.', 175.00, 148.00, 60.0, 'kg', 'images/groceries/products/pran_kalijira_rice_1kg.svg'],
            ['fresh-katari-bhog-rice-5kg', 'Fresh Katari Bhog Rice 5kg', 'fresh', 'rice-grains', 'Authentic Dinajpur Katari Bhog fragrant rice with exceptional taste.', 425.00, 375.00, 50.0, 'kg', 'images/groceries/products/fresh_katari_bhog_rice_5kg.svg'],

            // EDIBLE OIL & GHEE
            ['teer-soybean-oil-5l', 'Teer Fortified Soybean Oil 5L', 'teer', 'edible-oil-ghee', 'Vitamin A & D fortified edible soybean oil for healthy frying and cooking.', 840.00, 790.00, 45.0, 'ltr', 'images/groceries/products/teer_soybean_oil_5l.svg'],
            ['rupchanda-soybean-oil-2l', 'Rupchanda Fortified Soybean Oil 2L', 'rupchanda', 'edible-oil-ghee', 'Trusted pure soybean oil enriched with essential nutrients.', 345.00, 320.00, 60.0, 'ltr', 'images/groceries/products/rupchanda_soybean_oil_2l.svg'],
            ['fresh-soybean-oil-1l', 'Fresh Refined Soybean Oil 1L', 'fresh', 'edible-oil-ghee', 'Triple refined 100% pure vegetable soybean cooking oil.', 175.00, 162.00, 90.0, 'ltr', 'images/groceries/products/fresh_soybean_oil_1l.svg'],
            ['rupchanda-mustard-oil-500ml', 'Rupchanda Pure Mustard Oil 500ml', 'rupchanda', 'edible-oil-ghee', 'Pungent cold-pressed mustard oil for authentic Bangladeshi bhortas.', 165.00, 145.00, 70.0, 'ml', 'images/groceries/products/rupchanda_mustard_oil_500ml.svg'],
            ['radhuni-mustard-oil-250ml', 'Radhuni Pure Mustard Oil 250ml', 'radhuni', 'edible-oil-ghee', 'Traditional mustard oil with pungent aroma for fish and pickles.', 95.00, 82.00, 85.0, 'ml', 'images/groceries/products/radhuni_mustard_oil_250ml.svg'],
            ['aarong-pure-ghee-400g', 'Aarong Dairy Pure Ghee 400g', 'aarong-dairy', 'edible-oil-ghee', 'Golden granulated 100% cow milk ghee with authentic traditional aroma.', 540.00, 480.00, 35.0, 'g', 'images/groceries/products/aarong_pure_ghee_400g.svg'],

            // SPICES, SALT & SUGAR
            ['fresh-refined-sugar-1kg', 'Fresh Refined White Sugar 1kg', 'fresh', 'spices-salt-sugar', 'Pure sparkling white cane sugar for tea, sweets, and baking.', 140.00, 128.00, 120.0, 'kg', 'images/groceries/products/fresh_refined_sugar_1kg.svg'],
            ['teer-refined-sugar-1kg', 'Teer Refined White Sugar 1kg', 'teer', 'spices-salt-sugar', 'Clean and crystal clear refined sugar for all culinary uses.', 140.00, 128.00, 100.0, 'kg', 'images/groceries/products/teer_refined_sugar_1kg.svg'],
            ['aci-pure-vacuum-salt-1kg', 'ACI Pure Iodized Vacuum Salt 1kg', 'aci-pure', 'spices-salt-sugar', 'Free-flowing iodized refined table salt for daily health.', 42.00, 35.00, 150.0, 'kg', 'images/groceries/products/aci_pure_vacuum_salt_1kg.svg'],
            ['molla-super-salt-1kg', 'Molla Super Iodized Salt 1kg', 'molla-salt', 'spices-salt-sugar', 'Quality table salt enriched with essential iodine.', 38.00, 30.00, 130.0, 'kg', 'images/groceries/products/molla_super_salt_1kg.svg'],
            ['radhuni-turmeric-powder-200g', 'Radhuni Turmeric Powder (হলুদ গুঁড়া) 200g', 'radhuni', 'spices-salt-sugar', 'Vibrant golden turmeric powder ground from selected turmeric roots.', 85.00, 72.00, 95.0, 'g', 'images/groceries/products/radhuni_turmeric_powder_200g.svg'],
            ['radhuni-chilli-powder-200g', 'Radhuni Red Chilli Powder (মরিচ গুঁড়া) 200g', 'radhuni', 'spices-salt-sugar', 'Fiery and colorful pure red chilli powder.', 120.00, 102.00, 90.0, 'g', 'images/groceries/products/radhuni_chilli_powder_200g.svg'],
            ['radhuni-coriander-powder-200g', 'Radhuni Coriander Powder (ধনিয়া গুঁড়া) 200g', 'radhuni', 'spices-salt-sugar', 'Aromatic ground coriander powder for curries and stews.', 75.00, 62.00, 80.0, 'g', 'images/groceries/products/radhuni_coriander_powder_200g.svg'],
            ['radhuni-cumin-powder-100g', 'Radhuni Cumin Powder (জিরা গুঁড়া) 100g', 'radhuni', 'spices-salt-sugar', 'Freshly roasted and ground cumin powder with rich earthy aroma.', 90.00, 75.00, 85.0, 'g', 'images/groceries/products/radhuni_cumin_powder_100g.svg'],
            ['radhuni-beef-biryani-masala-40g', 'Radhuni Beef Biryani Masala 40g', 'radhuni', 'spices-salt-sugar', 'Complete spice blend for authentic Dhaka-style beef biryani.', 65.00, 52.00, 110.0, 'pcs', 'images/groceries/products/radhuni_beef_biryani_masala_40g.svg'],

            // DAL & PULSES
            ['pran-mosur-dal-1kg', 'Pran Premium Mosur Dal (মসুর ডাল) 1kg', 'pran', 'dal-pulses', 'Clean red lentils, cooks fast and yields rich aromatic dal.', 145.00, 128.00, 110.0, 'kg', 'images/groceries/products/pran_mosur_dal_1kg.svg'],
            ['aci-pure-mosur-dal-1kg', 'ACI Pure Mosur Dal 1kg', 'aci-pure', 'dal-pulses', 'Premium graded split red lentils with high protein content.', 150.00, 132.00, 95.0, 'kg', 'images/groceries/products/aci_pure_mosur_dal_1kg.svg'],
            ['fresh-mug-dal-500g', 'Fresh Roasted Mug Dal (মুগ ডাল) 500g', 'fresh', 'dal-pulses', 'Pre-roasted yellow split mung lentils with nutty aroma.', 110.00, 94.00, 70.0, 'g', 'images/groceries/products/fresh_mug_dal_500g.svg'],
            ['chashi-chhola-boot-1kg', 'Chashi Premium Chhola Boot (ছোলা) 1kg', 'chashi', 'dal-pulses', 'Top grade whole chickpeas, essential for iftar and healthy snacks.', 115.00, 98.00, 85.0, 'kg', 'images/groceries/products/chashi_chhola_boot_1kg.svg'],

            // ATTA, MAIDA & SUJI
            ['fresh-atta-2kg', 'Fresh Fortified Atta 2kg', 'fresh', 'atta-maida-suji', 'Whole wheat flour fortified with zinc and iron for soft rotis.', 130.00, 115.00, 90.0, 'kg', 'images/groceries/products/fresh_atta_2kg.svg'],
            ['teer-whole-wheat-atta-2kg', 'Teer Whole Wheat Atta 2kg', 'teer', 'atta-maida-suji', 'Fiber-rich whole wheat atta for nutritious daily chapattis.', 132.00, 116.00, 85.0, 'kg', 'images/groceries/products/teer_whole_wheat_atta_2kg.svg'],
            ['teer-maida-1kg', 'Teer Premium Maida 1kg', 'teer', 'atta-maida-suji', 'Refined wheat flour, ideal for crispy parathas, samosas, and cakes.', 78.00, 68.00, 95.0, 'kg', 'images/groceries/products/teer_maida_1kg.svg'],
            ['fresh-maida-1kg', 'Fresh All Purpose Maida 1kg', 'fresh', 'atta-maida-suji', 'Finely milled white flour for baking and frying snacks.', 78.00, 67.00, 80.0, 'kg', 'images/groceries/products/fresh_maida_1kg.svg'],
            ['aci-pure-suji-500g', 'ACI Pure Semolina / Suji 500g', 'aci-pure', 'atta-maida-suji', 'Coarsely purified wheat semolina for delicious halwa.', 55.00, 46.00, 75.0, 'g', 'images/groceries/products/aci_pure_suji_500g.svg'],

            // DAIRY & MILK
            ['dano-daily-pushti-500g', 'Dano Daily Pushti Milk Powder 500g', 'dano', 'dairy-milk', 'Full cream milk powder enriched with calcium and vitamins.', 430.00, 390.00, 50.0, 'g', 'images/groceries/products/dano_daily_pushti_500g.svg'],
            ['aarong-pasteurized-milk-1l', 'Aarong Pasteurized Liquid Milk 1L', 'aarong-dairy', 'dairy-milk', 'Fresh pasteurized cow milk packed in food-grade pouch.', 90.00, 80.00, 60.0, 'ltr', 'images/groceries/products/aarong_pasteurized_milk_1l.svg'],
            ['pran-uht-milk-500ml', 'Pran UHT Fresh Liquid Milk 500ml', 'pran', 'dairy-milk', 'Homogenized long-life UHT whole milk.', 50.00, 43.00, 80.0, 'ml', 'images/groceries/products/pran_uht_milk_500ml.svg'],

            // TEA & BEVERAGES
            ['ispahani-mirzapore-tea-400g', 'Ispahani Mirzapore Best Leaf Tea 400g', 'ispahani', 'tea-beverages', 'Premium CTC black tea blend offering deep color and brisk taste.', 240.00, 210.00, 65.0, 'g', 'images/groceries/products/ispahani_mirzapore_tea_400g.svg'],
            ['ispahani-tea-bags-50pcs', 'Ispahani Mirzapore Tea Bags 50s Box', 'ispahani', 'tea-beverages', 'Convenient individually wrapped black tea bags for office & home.', 130.00, 112.00, 75.0, 'box', 'images/groceries/products/ispahani_tea_bags_50pcs.svg'],
            ['taaza-black-tea-200g', 'Taaza Danedar Black Tea 200g', 'taaza', 'tea-beverages', 'Granulated fresh garden tea for an energizing morning cup.', 125.00, 108.00, 70.0, 'g', 'images/groceries/products/taaza_black_tea_200g.svg'],
            ['kazi-kazi-green-tea-25s', 'Kazi & Kazi Organic Green Tea 25 Bags', 'kazi-kazi', 'tea-beverages', '100% certified organic antioxidant-rich green tea from Panchagarh.', 160.00, 138.00, 50.0, 'box', 'images/groceries/products/kazi_kazi_green_tea_25s.svg'],

            // SNACKS & BISCUITS
            ['maggi-noodles-8pack', 'Maggi 2-Minute Masala Noodles Family 8-Pack', 'maggi', 'snacks-biscuits', 'Beloved 2-minute instant noodles with authentic tastemaker spices.', 180.00, 155.00, 80.0, 'pack', 'images/groceries/products/maggi_noodles_8pack.svg'],
            ['maggi-noodles-single', 'Maggi 2-Minute Noodles Single Pack', 'maggi', 'snacks-biscuits', 'Single serving classic instant masala noodles.', 25.00, 21.00, 150.0, 'pcs', 'images/groceries/products/maggi_noodles_single.svg'],
            ['olympic_energy_plus_300g', 'Olympic Energy Plus Biscuits 300g Pack', 'olympic', 'snacks-biscuits', 'Glucose and malt enriched crunchy biscuits for active families.', 65.00, 54.00, 95.0, 'pack', 'images/groceries/products/olympic_energy_plus_300g.svg'],
            ['olympic_tip_top_200g', 'Olympic Tip Top Cookies 200g', 'olympic', 'snacks-biscuits', 'Delicious butter flavored crispy tea biscuits.', 50.00, 41.00, 100.0, 'pack', 'images/groceries/products/olympic_tip_top_200g.svg'],
            ['pran-potata-biscuit', 'Pran Potata Spicy Crispy Biscuits', 'pran', 'snacks-biscuits', 'Crispy and savory potato thin biscuits with spicy twist.', 35.00, 28.00, 120.0, 'pack', 'images/groceries/products/pran_potata_biscuit.svg'],

            // BAKERY & EGGS
            ['kazi-farms-brown-eggs-1dozen', 'Kazi Farms Fresh Brown Eggs 1 Dozen', 'kazi-kazi', 'bakery-eggs', 'Hygienically sorted fresh farm brown eggs rich in protein.', 165.00, 142.00, 50.0, 'dozen', 'images/groceries/products/kazi_farms_brown_eggs_1dozen.svg'],
            ['farm-fresh-white-eggs-1dozen', 'Farm Fresh Clean White Eggs 1 Dozen', 'fresh', 'bakery-eggs', 'Premium layer white eggs for nutritious family breakfasts.', 155.00, 135.00, 60.0, 'dozen', 'images/groceries/products/farm_fresh_white_eggs_1dozen.svg'],

            // PERSONAL CARE & SOAP
            ['lux-soft-rose-soap-100g', 'Lux Soft Rose Beauty Soap 100g', 'lux', 'personal-care', 'Floral beauty soap infused with rose oil and vitamin C.', 60.00, 50.00, 120.0, 'pcs', 'images/groceries/products/lux_soft_rose_soap_100g.svg'],
            ['lifebuoy-total-soap-100g', 'Lifebuoy Total Germ Protection Soap 100g', 'lifebuoy', 'personal-care', 'Antibacterial health soap with Activ Silver formula.', 55.00, 45.00, 140.0, 'pcs', 'images/groceries/products/lifebuoy_total_soap_100g.svg'],
            ['sunsilk-black-shine-375ml', 'Sunsilk Black Shine Shampoo 375ml', 'sunsilk', 'personal-care', 'Amla pearl complex shampoo for shiny healthy black hair.', 360.00, 310.00, 40.0, 'ml', 'images/groceries/products/sunsilk_black_shine_375ml.svg'],
            ['parachute-coconut-oil-200ml', 'Parachute Pure Coconut Oil 200ml', 'parachute', 'personal-care', '100% pure edible coconut oil for natural hair nourishing.', 160.00, 138.00, 65.0, 'ml', 'images/groceries/products/parachute_coconut_oil_200ml.svg'],

            // HOUSEHOLD & CLEANING
            ['harpic-toilet-cleaner-750ml', 'Harpic Power Plus Toilet Cleaner 750ml', 'harpic', 'cleaning-household', 'Deep cleaning disinfectant liquid removing 99.9% germs and stains.', 175.00, 150.00, 55.0, 'ml', 'images/groceries/products/harpic_toilet_cleaner_750ml.svg'],
            ['harpic-bathroom-cleaner-500ml', 'Harpic Bathroom Cleaner Trigger 500ml', 'harpic', 'cleaning-household', 'Effective tiles and bathroom surface cleaner with fresh fragrance.', 140.00, 120.00, 45.0, 'ml', 'images/groceries/products/harpic_bathroom_cleaner_500ml.svg'],
            ['wheel-detergent-powder-1kg', 'Wheel 2-in-1 Detergent Powder 1kg', 'wheel', 'cleaning-household', 'Lemon and jasmine laundry washing powder with active power.', 130.00, 112.00, 80.0, 'kg', 'images/groceries/products/wheel_detergent_powder_1kg.svg'],
            ['rin-detergent-powder-1kg', 'Rin Advanced Detergent Powder 1kg', 'rin', 'cleaning-household', 'Bright clean laundry powder for dazzling white and color clothes.', 160.00, 138.00, 75.0, 'kg', 'images/groceries/products/rin_detergent_powder_1kg.svg'],
            ['vim-dishwash-bar-300g', 'Vim Dishwash Bar 300g with Polycoat', 'vim', 'cleaning-household', 'Lemon power dishwashing soap bar removing stubborn grease.', 40.00, 32.00, 120.0, 'pcs', 'images/groceries/products/vim_dishwash_bar_300g.svg'],
            ['vim-dishwash-liquid-500ml', 'Vim Dishwash Gel Liquid 500ml', 'vim', 'cleaning-household', 'Concentrated lemon dishwashing gel giving spotless utensils.', 150.00, 128.00, 50.0, 'ml', 'images/groceries/products/vim_dishwash_liquid_500ml.svg'],
            ['savlon-antiseptic-500ml', 'Savlon Antiseptic Disinfectant Liquid 500ml', 'savlon', 'cleaning-household', 'Hospital grade antiseptic liquid for wound care and household hygiene.', 210.00, 180.00, 40.0, 'ml', 'images/groceries/products/savlon_antiseptic_500ml.svg'],
        ];

        foreach ($productsData as [$slug, $pName, $brandSlug, $catSlug, $desc, $price, $costPrice, $stockQty, $unit, $imgPath]) {
            $catId = $categories[$catSlug]->id ?? null;
            $brandId = $brands[$brandSlug]->id ?? null;

            $product = Product::withoutGlobalScopes()
                ->where('shop_id', $shopId)
                ->where('slug', $slug)
                ->first();

            if (!$product) {
                $product = Product::withoutGlobalScopes()->create([
                    'shop_id' => $shopId,
                    'category_id' => $catId,
                    'brand_id' => $brandId,
                    'name' => $pName,
                    'slug' => $slug,
                    'description' => $desc,
                    'price' => $price,
                    'cost_price' => $costPrice,
                    'stock_quantity' => $stockQty,
                    'stock_unit' => $unit,
                    'status' => 'published',
                    'created_by' => $owner->id,
                    'updated_by' => $owner->id,
                ]);
            } else {
                $product->update([
                    'category_id' => $catId,
                    'brand_id' => $brandId,
                    'name' => $pName,
                    'description' => $desc,
                    'price' => $price,
                    'cost_price' => $costPrice,
                    'stock_quantity' => $stockQty,
                    'stock_unit' => $unit,
                    'status' => 'published',
                ]);
            }

            // Product Image
            ProductImage::withoutGlobalScopes()->updateOrCreate(
                ['shop_id' => $shopId, 'product_id' => $product->id],
                ['path' => $imgPath, 'sort_order' => 1]
            );
        }
    }
}
