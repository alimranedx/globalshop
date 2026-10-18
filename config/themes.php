<?php

return [
    /*
    |--------------------------------------------------------------------------
    | GlobalShop Multi-Tenant Theme Registry
    |--------------------------------------------------------------------------
    |
    | Defines all available pre-designed storefront themes for tenant shops.
    | Shop owners can switch themes and customize color palettes, banners,
    | typography, and section toggles.
    |
    */

    'themes' => [
        'default' => [
            'id' => 'default',
            'name' => 'Modern Minimalist',
            'tagline' => 'Clean, high-conversion layout suited for general retail',
            'category' => 'General / Multi-Category',
            'badge' => 'Standard',
            'preview_image' => '/images/themes/default-preview.jpg',
            'features' => [
                'Responsive grid layout',
                'Slide-out shopping cart drawer',
                'Header announcement bar',
                'Hero banner slider',
                'Clean typography and white space'
            ],
            'default_config' => [
                'colors' => [
                    'primary' => '#2563EB',
                    'accent' => '#F59E0B',
                    'header_bg' => '#FFFFFF',
                    'header_text' => '#1E293B',
                    'footer_bg' => '#0F172A',
                    'footer_text' => '#F8FAFC',
                ],
                'typography' => [
                    'font_family' => 'Inter, sans-serif',
                ],
                'announcement' => [
                    'enabled' => true,
                    'text' => '✨ Welcome to our official store! Fast & reliable delivery guaranteed.',
                    'bg_color' => '#1E293B',
                    'text_color' => '#FFFFFF',
                ],
                'hero' => [
                    'headline' => 'Elevate Your Everyday Shopping',
                    'subheadline' => 'Discover our hand-picked collection of premium products at unbeatable prices.',
                    'button_text' => 'Shop Collection',
                    'button_link' => '#catalog',
                    'banner_image' => '/images/banners/default-hero.jpg',
                ],
                'sections' => [
                    'show_categories' => true,
                    'show_featured_brands' => true,
                    'show_trending_products' => true,
                    'show_newsletter' => true,
                ],
            ],
        ],

        'grocery' => [
            'id' => 'grocery',
            'name' => 'Grocery & Daily Fresh',
            'tagline' => 'High-density catalog with quick-add to cart and unit pricing',
            'category' => 'Supermarket & Fresh Groceries',
            'badge' => 'Popular',
            'preview_image' => '/images/themes/grocery-preview.jpg',
            'features' => [
                'Sticky category sidebar navigation',
                'Weight & unit pricing badges (kg, liter, pcs)',
                '1-click instant quantity incrementors',
                'Fresh green organic color palette',
                'Express delivery badge banner'
            ],
            'default_config' => [
                'colors' => [
                    'primary' => '#16A34A',
                    'accent' => '#F97316',
                    'header_bg' => '#F0FDF4',
                    'header_text' => '#14532D',
                    'footer_bg' => '#064E3B',
                    'footer_text' => '#DCFCE7',
                ],
                'typography' => [
                    'font_family' => 'system-ui, -apple-system, sans-serif',
                ],
                'announcement' => [
                    'enabled' => true,
                    'text' => '🥦 Same-day fresh groceries delivery on orders placed before 4 PM!',
                    'bg_color' => '#15803D',
                    'text_color' => '#FFFFFF',
                ],
                'hero' => [
                    'headline' => 'Fresh From Farm to Your Kitchen',
                    'subheadline' => '100% organic produce, pantry staples, and daily household essentials.',
                    'button_text' => 'Explore Fresh Market',
                    'button_link' => '#catalog',
                    'banner_image' => '/images/banners/grocery-hero.jpg',
                ],
                'sections' => [
                    'show_categories' => true,
                    'show_featured_brands' => true,
                    'show_trending_products' => true,
                    'show_daily_deals' => true,
                    'show_newsletter' => false,
                ],
            ],
        ],

        'boutique' => [
            'id' => 'boutique',
            'name' => 'Fashion & Luxury Boutique',
            'tagline' => 'Editorial aesthetics, dramatic full-bleed imagery, and lookbooks',
            'category' => 'Fashion, Apparel & Jewelry',
            'badge' => 'Premium',
            'preview_image' => '/images/themes/boutique-preview.jpg',
            'features' => [
                'Full-bleed hero imagery and lookbook carousels',
                'Serif typography and refined spacing',
                'Hover zoom product cards',
                'Curated collection spotlights',
                'Minimalist luxury aesthetic'
            ],
            'default_config' => [
                'colors' => [
                    'primary' => '#9333EA',
                    'accent' => '#D97706',
                    'header_bg' => '#FAF5FF',
                    'header_text' => '#581C87',
                    'footer_bg' => '#2E1065',
                    'footer_text' => '#F3E8FF',
                ],
                'typography' => [
                    'font_family' => 'Georgia, serif',
                ],
                'announcement' => [
                    'enabled' => true,
                    'text' => '👗 New Season Arrivals: Enjoy complimentary gift wrapping on all designer orders.',
                    'bg_color' => '#6B21A8',
                    'text_color' => '#FFFFFF',
                ],
                'hero' => [
                    'headline' => 'Timeless Elegance, Modern Style',
                    'subheadline' => 'Handcrafted fashion pieces made with bespoke fabrics and timeless tailoring.',
                    'button_text' => 'Discover Lookbook',
                    'button_link' => '#catalog',
                    'banner_image' => '/images/banners/boutique-hero.jpg',
                ],
                'sections' => [
                    'show_categories' => true,
                    'show_featured_brands' => true,
                    'show_trending_products' => true,
                    'show_lookbook' => true,
                    'show_newsletter' => true,
                ],
            ],
        ],

        'tech' => [
            'id' => 'tech',
            'name' => 'Tech & Digital Gadgets',
            'tagline' => 'Futuristic dark-tinted design with technical spec badges and matrix filters',
            'category' => 'Electronics, Mobiles & Hardware',
            'badge' => 'Tech Focus',
            'preview_image' => '/images/themes/tech-preview.jpg',
            'features' => [
                'Sleek dark-mode header & high-contrast cards',
                'Detailed technical specifications panel',
                'Warranty and fast-shipping badges',
                'Brand filter chips (Apple, Samsung, Sony, etc.)',
                'Comparison mode ready'
            ],
            'default_config' => [
                'colors' => [
                    'primary' => '#0284C7',
                    'accent' => '#06B6D4',
                    'header_bg' => '#0F172A',
                    'header_text' => '#F1F5F9',
                    'footer_bg' => '#020617',
                    'footer_text' => '#94A3B8',
                ],
                'typography' => [
                    'font_family' => 'Inter, -apple-system, sans-serif',
                ],
                'announcement' => [
                    'enabled' => true,
                    'text' => '⚡ Free official 1-year replacement warranty on all smart devices & accessories.',
                    'bg_color' => '#0369A1',
                    'text_color' => '#FFFFFF',
                ],
                'hero' => [
                    'headline' => 'Next-Gen Performance In Your Hands',
                    'subheadline' => 'Experience blistering speeds, ultra-clear displays, and cutting-edge audio gear.',
                    'button_text' => 'Browse Hardware',
                    'button_link' => '#catalog',
                    'banner_image' => '/images/banners/tech-hero.jpg',
                ],
                'sections' => [
                    'show_categories' => true,
                    'show_featured_brands' => true,
                    'show_trending_products' => true,
                    'show_spec_highlights' => true,
                    'show_newsletter' => true,
                ],
            ],
        ],
    ],
];
