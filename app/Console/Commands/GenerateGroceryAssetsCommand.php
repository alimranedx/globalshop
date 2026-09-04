<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class GenerateGroceryAssetsCommand extends Command
{
    protected $signature = 'grocery:generate-assets';
    protected $description = 'Generate SVG image assets for Bangladeshi grocery categories, brands, and products';

    public function handle(): int
    {
        $baseDir = public_path('images/groceries');
        $catDir = $baseDir . '/categories';
        $brandDir = $baseDir . '/brands';
        $prodDir = $baseDir . '/products';

        File::ensureDirectoryExists($catDir);
        File::ensureDirectoryExists($brandDir);
        File::ensureDirectoryExists($prodDir);

        $this->generateCategories($catDir);
        $this->generateBrands($brandDir);
        $this->generateProducts($prodDir);

        $this->info("Successfully generated all grocery SVG assets in {$baseDir}!");
        return Command::SUCCESS;
    }

    private function generateCategories(string $dir): void
    {
        $categories = [
            ['rice_grains.svg', 'Rice & Grains', 'চাউল ও খাদ্যশস্য', '#F59E0B', '#D97706', '🌾'],
            ['edible_oil.svg', 'Edible Oil & Ghee', 'ভোজ্য তেল ও ঘি', '#EAB308', '#CA8A04', '🛢️'],
            ['spices_salt.svg', 'Spices & Salt', 'মশলা ও লবণ', '#EF4444', '#DC2626', '🌶️'],
            ['pulses_dal.svg', 'Dal & Pulses', 'ডাল ও ডালজাতীয়', '#F97316', '#EA580C', '🥣'],
            ['flour_atta.svg', 'Atta, Maida & Suji', 'আটা ও ময়দা', '#EAB308', '#B45309', '🥖'],
            ['dairy_milk.svg', 'Dairy & Milk', 'দুধ ও দুগ্ধজাত', '#06B6D4', '#0891B2', '🥛'],
            ['tea_beverages.svg', 'Tea, Coffee & Drinks', 'চা ও পানীয়', '#10B981', '#059669', '☕'],
            ['snacks_biscuits.svg', 'Snacks & Biscuits', 'স্ন্যাকস ও বিস্কুট', '#F59E0B', '#D97706', '🍪'],
            ['personal_care.svg', 'Personal Care & Soap', 'সাবান ও শ্যাম্পু', '#8B5CF6', '#7C3AED', '🧼'],
            ['cleaning_household.svg', 'Cleaning & Home', 'হারপিক ও ক্লিনিং', '#3B82F6', '#2563EB', '🧹'],
            ['bakery_eggs.svg', 'Bakery & Fresh Eggs', 'ডিম ও বেকারি', '#EC4899', '#DB2777', '🥚'],
            ['baby_nutrition.svg', 'Baby Nutrition', 'শিশুপণ্য ও খাবার', '#14B8A6', '#0D9488', '🍼'],
        ];

        foreach ($categories as [$file, $en, $bn, $c1, $c2, $icon]) {
            $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <linearGradient id="grad_{$file}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{$c1}" />
      <stop offset="100%" stop-color="{$c2}" />
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="40" fill="url(#grad_{$file})"/>
  <circle cx="150" cy="115" r="56" fill="#ffffff" fill-opacity="0.22"/>
  <text x="150" y="132" font-size="52" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">{$icon}</text>
  <text x="150" y="210" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="Outfit, Segoe UI, sans-serif">{$en}</text>
  <text x="150" y="240" font-size="16" font-weight="500" fill="#ffffff" fill-opacity="0.9" text-anchor="middle" font-family="Kalpurush, SolaimanLipi, Segoe UI, sans-serif">{$bn}</text>
</svg>
SVG;
            file_put_contents($dir . '/' . $file, $svg);
        }
    }

    private function generateBrands(string $dir): void
    {
        $brands = [
            ['pran.svg', 'PRAN', 'Trust of Millions', '#EF4444', '#991B1B'],
            ['teer.svg', 'TEER', 'Pure & Healthy', '#3B82F6', '#1E40AF'],
            ['radhuni.svg', 'RADHUNI', 'Pure Spices', '#D97706', '#92400E'],
            ['rupchanda.svg', 'RUPCHANDA', 'BEOL Bangladesh', '#EAB308', '#A16207'],
            ['aci_pure.svg', 'ACI PURE', 'Pure Food Living', '#059669', '#065F46'],
            ['fresh.svg', 'FRESH', 'Meghna Group', '#2563EB', '#1D4ED8'],
            ['aarong_dairy.svg', 'AARONG', 'BRAC Dairy Farm', '#06B6D4', '#0E7490'],
            ['dano.svg', 'DANO', 'Daily Nutrition Arla', '#3B82F6', '#1D4ED8'],
            ['ispahani.svg', 'ISPAHANI', 'Mirzapore Best Leaf', '#10B981', '#047857'],
            ['taaza.svg', 'TAAZA', 'Unilever Tea', '#059669', '#064E3B'],
            ['harpic.svg', 'HARPIC', 'Reckitt Hygiene', '#2563EB', '#1E3A8A'],
            ['lux.svg', 'LUX', 'Beauty Soap Unilever', '#EC4899', '#9D174D'],
            ['lifebuoy.svg', 'LIFEBUOY', 'Germ Protection', '#DC2626', '#7F1D1D'],
            ['sunsilk.svg', 'SUNSILK', 'Hair Care Unilever', '#8B5CF6', '#5B21B6'],
            ['wheel.svg', 'WHEEL', 'Unilever Laundry', '#0284C7', '#0369A1'],
            ['rin.svg', 'RIN', 'Lightning Clean', '#3B82F6', '#1E40AF'],
            ['maggi.svg', 'MAGGI', 'Nestle 2-Min Fun', '#EAB308', '#B45309'],
            ['olympic.svg', 'OLYMPIC', 'Biscuits & Cookies', '#F97316', '#C2410C'],
            ['chashi.svg', 'CHASHI', 'Aromatic Rice & Grain', '#15803D', '#166534'],
            ['molla_salt.svg', 'MOLLA SALT', 'Super Iodized Salt', '#0284C7', '#075985'],
            ['vim.svg', 'VIM', 'Power Degreaser', '#65A30D', '#4D7C0F'],
            ['savlon.svg', 'SAVLON', 'Antiseptic Shield', '#0D9488', '#115E59'],
            ['parachute.svg', 'PARACHUTE', 'Pure Coconut Oil', '#0284C7', '#0369A1'],
            ['kazi_kazi.svg', 'KAZI & KAZI', 'Organic Farm Tea', '#15803D', '#14532D'],
        ];

        foreach ($brands as [$file, $name, $tagline, $c1, $c2]) {
            $initial = $name[0];
            $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <linearGradient id="b_grad_{$file}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{$c1}" />
      <stop offset="100%" stop-color="{$c2}" />
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="36" fill="url(#b_grad_{$file})"/>
  <rect x="24" y="24" width="252" height="252" rx="24" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2"/>
  <circle cx="150" cy="115" r="48" fill="#ffffff"/>
  <text x="150" y="128" font-size="36" font-weight="900" fill="{$c2}" text-anchor="middle" font-family="Outfit, sans-serif">{$initial}</text>
  <text x="150" y="200" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle" font-family="Outfit, sans-serif">{$name}</text>
  <text x="150" y="230" font-size="13" font-weight="500" fill="#ffffff" fill-opacity="0.85" text-anchor="middle" font-family="Outfit, sans-serif">{$tagline}</text>
</svg>
SVG;
            file_put_contents($dir . '/' . $file, $svg);
        }
    }

    private function generateProducts(string $dir): void
    {
        $products = [
            ['chashi_chinigura_rice_1kg.svg', 'Chashi Chinigura Rice', 'CHASHI', 'Rice & Grains', '1 kg', '#15803D', '#14532D', '🌾'],
            ['teer_miniket_rice_5kg.svg', 'Teer Miniket Rice', 'TEER', 'Rice & Grains', '5 kg', '#3B82F6', '#1E40AF', '🌾'],
            ['aci_pure_nazirshail_rice_5kg.svg', 'ACI Pure Nazirshail Rice', 'ACI PURE', 'Rice & Grains', '5 kg', '#059669', '#065F46', '🌾'],
            ['pran_kalijira_rice_1kg.svg', 'Pran Kalijira Rice', 'PRAN', 'Rice & Grains', '1 kg', '#DC2626', '#991B1B', '🌾'],
            ['fresh_katari_bhog_rice_5kg.svg', 'Fresh Katari Bhog Rice', 'FRESH', 'Rice & Grains', '5 kg', '#2563EB', '#1D4ED8', '🌾'],

            ['teer_soybean_oil_5l.svg', 'Teer Fortified Soybean Oil', 'TEER', 'Edible Oil', '5 Litre', '#EAB308', '#CA8A04', '🛢️'],
            ['rupchanda_soybean_oil_2l.svg', 'Rupchanda Soybean Oil', 'RUPCHANDA', 'Edible Oil', '2 Litre', '#EAB308', '#A16207', '🛢️'],
            ['fresh_soybean_oil_1l.svg', 'Fresh Refined Soybean Oil', 'FRESH', 'Edible Oil', '1 Litre', '#F59E0B', '#B45309', '🛢️'],
            ['rupchanda_mustard_oil_500ml.svg', 'Rupchanda Mustard Oil', 'RUPCHANDA', 'Edible Oil', '500 ml', '#CA8A04', '#854D0E', '🛢️'],
            ['radhuni_mustard_oil_250ml.svg', 'Radhuni Pure Mustard Oil', 'RADHUNI', 'Edible Oil', '250 ml', '#D97706', '#92400E', '🛢️'],
            ['aarong_pure_ghee_400g.svg', 'Aarong Dairy Pure Ghee', 'AARONG', 'Edible Oil', '400 g', '#0891B2', '#0E7490', '🧈'],

            ['fresh_refined_sugar_1kg.svg', 'Fresh Refined White Sugar', 'FRESH', 'Sugar', '1 kg', '#3B82F6', '#1E40AF', '🧂'],
            ['teer_refined_sugar_1kg.svg', 'Teer Refined Cane Sugar', 'TEER', 'Sugar', '1 kg', '#6366F1', '#4338CA', '🧂'],
            ['aci_pure_vacuum_salt_1kg.svg', 'ACI Pure Iodized Salt', 'ACI PURE', 'Salt', '1 kg', '#059669', '#065F46', '🧂'],
            ['molla_super_salt_1kg.svg', 'Molla Super Salt', 'MOLLA SALT', 'Salt', '1 kg', '#0284C7', '#075985', '🧂'],
            ['radhuni_turmeric_powder_200g.svg', 'Radhuni Turmeric Powder', 'RADHUNI', 'Spices', '200 g', '#EAB308', '#A16207', '🌶️'],
            ['radhuni_chilli_powder_200g.svg', 'Radhuni Red Chilli Powder', 'RADHUNI', 'Spices', '200 g', '#DC2626', '#991B1B', '🌶️'],
            ['radhuni_coriander_powder_200g.svg', 'Radhuni Coriander Powder', 'RADHUNI', 'Spices', '200 g', '#65A30D', '#3F6212', '🌶️'],
            ['radhuni_cumin_powder_100g.svg', 'Radhuni Cumin Powder', 'RADHUNI', 'Spices', '100 g', '#B45309', '#78350F', '🌶️'],
            ['radhuni_beef_biryani_masala_40g.svg', 'Radhuni Beef Biryani Masala', 'RADHUNI', 'Spices', '40 g', '#9A3412', '#7C2D12', '📦'],

            ['pran_mosur_dal_1kg.svg', 'Pran Premium Mosur Dal', 'PRAN', 'Dal & Pulses', '1 kg', '#EA580C', '#9A3412', '🥣'],
            ['aci_pure_mosur_dal_1kg.svg', 'ACI Pure Mosur Dal', 'ACI PURE', 'Dal & Pulses', '1 kg', '#059669', '#064E3B', '🥣'],
            ['fresh_mug_dal_500g.svg', 'Fresh Roasted Mug Dal', 'FRESH', 'Dal & Pulses', '500 g', '#F59E0B', '#B45309', '🥣'],
            ['chashi_chhola_boot_1kg.svg', 'Chashi Premium Chhola Boot', 'CHASHI', 'Dal & Pulses', '1 kg', '#15803D', '#166534', '🥣'],

            ['fresh_atta_2kg.svg', 'Fresh Fortified Atta', 'FRESH', 'Flour', '2 kg', '#2563EB', '#1D4ED8', '🥖'],
            ['teer_whole_wheat_atta_2kg.svg', 'Teer Whole Wheat Atta', 'TEER', 'Flour', '2 kg', '#D97706', '#92400E', '🥖'],
            ['teer_maida_1kg.svg', 'Teer Premium Maida', 'TEER', 'Flour', '1 kg', '#3B82F6', '#1E40AF', '🥖'],
            ['fresh_maida_1kg.svg', 'Fresh All Purpose Maida', 'FRESH', 'Flour', '1 kg', '#60A5FA', '#2563EB', '🥖'],
            ['aci_pure_suji_500g.svg', 'ACI Pure Semolina Suji', 'ACI PURE', 'Flour', '500 g', '#059669', '#065F46', '🥖'],

            ['dano_daily_pushti_500g.svg', 'Dano Daily Pushti Milk', 'DANO', 'Dairy & Milk', '500 g', '#3B82F6', '#1D4ED8', '🥛'],
            ['aarong_pasteurized_milk_1l.svg', 'Aarong Pasteurized Liquid Milk', 'AARONG', 'Dairy & Milk', '1 Litre', '#0891B2', '#0E7490', '🥛'],
            ['pran_uht_milk_500ml.svg', 'Pran UHT Fresh Milk', 'PRAN', 'Dairy & Milk', '500 ml', '#DC2626', '#991B1B', '🥛'],

            ['ispahani_mirzapore_tea_400g.svg', 'Ispahani Mirzapore Tea', 'ISPAHANI', 'Tea & Coffee', '400 g', '#10B981', '#047857', '☕'],
            ['ispahani_tea_bags_50pcs.svg', 'Ispahani Tea Bags 50s', 'ISPAHANI', 'Tea & Coffee', '50 Bags', '#059669', '#064E3B', '📦'],
            ['taaza_black_tea_200g.svg', 'Taaza Black Tea', 'TAAZA', 'Tea & Coffee', '200 g', '#0D9488', '#115E59', '☕'],
            ['kazi_kazi_green_tea_25s.svg', 'Kazi & Kazi Green Tea', 'KAZI & KAZI', 'Tea & Coffee', '25 Bags', '#15803D', '#14532D', '☕'],

            ['maggi_noodles_8pack.svg', 'Maggi 2-Min Noodles Family', 'MAGGI', 'Snacks & Noodles', '8 Pack', '#EAB308', '#B45309', '🍜'],
            ['maggi_noodles_single.svg', 'Maggi 2-Min Noodles Single', 'MAGGI', 'Snacks & Noodles', '1 Pcs', '#F59E0B', '#D97706', '🍜'],
            ['olympic_energy_plus_300g.svg', 'Olympic Energy Plus Biscuit', 'OLYMPIC', 'Snacks & Biscuits', '300 g', '#F97316', '#C2410C', '🍪'],
            ['olympic_tip_top_200g.svg', 'Olympic Tip Top Cookies', 'OLYMPIC', 'Snacks & Biscuits', '200 g', '#EA580C', '#9A3412', '🍪'],
            ['pran_potata_biscuit.svg', 'Pran Potata Spicy Biscuits', 'PRAN', 'Snacks & Biscuits', '100 g', '#DC2626', '#991B1B', '🥔'],

            ['kazi_farms_brown_eggs_1dozen.svg', 'Kazi Farms Brown Eggs', 'KAZI & KAZI', 'Bakery & Eggs', '1 Dozen', '#B45309', '#78350F', '🥚'],
            ['farm_fresh_white_eggs_1dozen.svg', 'Farm Fresh White Eggs', 'FRESH', 'Bakery & Eggs', '1 Dozen', '#2563EB', '#1D4ED8', '🥚'],

            ['lux_soft_rose_soap_100g.svg', 'Lux Soft Rose Beauty Soap', 'LUX', 'Personal Care', '100 g', '#EC4899', '#9D174D', '🧼'],
            ['lifebuoy_total_soap_100g.svg', 'Lifebuoy Total Bar Soap', 'LIFEBUOY', 'Personal Care', '100 g', '#DC2626', '#7F1D1D', '🧼'],
            ['sunsilk_black_shine_375ml.svg', 'Sunsilk Black Shine Shampoo', 'SUNSILK', 'Personal Care', '375 ml', '#8B5CF6', '#5B21B6', '🧴'],
            ['parachute_coconut_oil_200ml.svg', 'Parachute Pure Coconut Oil', 'PARACHUTE', 'Personal Care', '200 ml', '#0284C7', '#0369A1', '🥥'],

            ['harpic_toilet_cleaner_750ml.svg', 'Harpic Power Plus Cleaner', 'HARPIC', 'Household Cleaning', '750 ml', '#1D4ED8', '#1E3A8A', '🚽'],
            ['harpic_bathroom_cleaner_500ml.svg', 'Harpic Bathroom Cleaner', 'HARPIC', 'Household Cleaning', '500 ml', '#2563EB', '#1E40AF', '🧽'],
            ['wheel_detergent_powder_1kg.svg', 'Wheel 2-in-1 Detergent Powder', 'WHEEL', 'Household Cleaning', '1 kg', '#0284C7', '#0369A1', '🧺'],
            ['rin_detergent_powder_1kg.svg', 'Rin Advanced Detergent Powder', 'RIN', 'Household Cleaning', '1 kg', '#3B82F6', '#1E40AF', '🧺'],
            ['vim_dishwash_bar_300g.svg', 'Vim Dishwash Bar', 'VIM', 'Household Cleaning', '300 g', '#65A30D', '#3F6212', '🧼'],
            ['vim_dishwash_liquid_500ml.svg', 'Vim Dishwash Gel Liquid', 'VIM', 'Household Cleaning', '500 ml', '#84CC16', '#4D7C0F', '🧴'],
            ['savlon_antiseptic_500ml.svg', 'Savlon Antiseptic Liquid', 'SAVLON', 'Household Hygiene', '500 ml', '#0D9488', '#115E59', '🩹'],
        ];

        foreach ($products as [$file, $name, $brand, $cat, $wt, $c1, $c2, $icon]) {
            $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="p_grad_{$file}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{$c1}" />
      <stop offset="100%" stop-color="{$c2}" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="36" fill="url(#p_grad_{$file})"/>
  <rect x="20" y="20" width="360" height="360" rx="26" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2"/>
  
  <rect x="36" y="36" width="130" height="28" rx="14" fill="#ffffff" fill-opacity="0.22"/>
  <text x="101" y="55" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="Outfit, sans-serif">{$brand}</text>
  
  <rect x="234" y="36" width="130" height="28" rx="14" fill="#000000" fill-opacity="0.25"/>
  <text x="299" y="55" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="Outfit, sans-serif">{$wt}</text>

  <circle cx="200" cy="180" r="75" fill="#ffffff"/>
  <text x="200" y="206" font-size="76" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">{$icon}</text>

  <text x="200" y="295" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle" font-family="Outfit, sans-serif">{$name}</text>
  <text x="200" y="325" font-size="15" font-weight="600" fill="#ffffff" fill-opacity="0.88" text-anchor="middle" font-family="Outfit, sans-serif">{$cat} • {$wt}</text>
  <rect x="130" y="342" width="140" height="22" rx="11" fill="#ffffff" fill-opacity="0.2"/>
  <text x="200" y="357" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.5" font-family="Outfit, sans-serif">GENUINE BANGLADESH</text>
</svg>
SVG;
            file_put_contents($dir . '/' . $file, $svg);
        }
    }
}
