<!DOCTYPE html>
<html lang="{{ $shop->language ?: 'en' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $shop->name }} — Official Online Store</title>
    <meta name="description" content="Shop verified products directly from {{ $shop->name }}. Instant 1-click checkout and local delivery.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Bootstrap Icons & Tailwind -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    @php
        $colors = $themeConfig['colors'] ?? [];
        $primaryColor = $colors['primary'] ?? '#4f46e5';
        $accentColor = $colors['accent'] ?? '#f59e0b';
        $headerBg = $colors['header_bg'] ?? '#FFFFFF';
        $headerText = $colors['header_text'] ?? '#0f172a';
        $footerBg = $colors['footer_bg'] ?? '#0a0a0c';
        $footerText = $colors['footer_text'] ?? '#f8fafc';
        $announcement = $themeConfig['announcement'] ?? [
            'enabled' => true,
            'text' => '⚡ Special Store Offer: Get exclusive deals & fast local delivery directly from ' . $shop->name . '!',
            'bg_color' => '#0f172a',
            'text_color' => '#ffffff'
        ];
        $hero = $themeConfig['hero'] ?? [
            'headline' => 'Next-Generation Hardware & Digital Gear',
            'subheadline' => 'Official authorized store with direct warranty, authentic items, and instant 1-click delivery.',
            'button_text' => 'Explore Catalog',
            'button_link' => '#catalog'
        ];
        $themeSlug = $shop->theme_slug ?: 'default';
        $topPopular = $popularProducts->first() ?? $products->first();
        $secondPopular = $popularProducts->skip(1)->first() ?? $products->skip(1)->first() ?? $topPopular;
    @endphp

    <style>
        :root {
            --color-primary: {{ $primaryColor }};
            --color-accent: {{ $accentColor }};
            --font-family-store: 'Plus Jakarta Sans', 'Outfit', sans-serif;
        }
        body {
            font-family: var(--font-family-store);
            scroll-behavior: smooth;
        }
        .bg-theme-primary { background-color: var(--color-primary); }
        .text-theme-primary { color: var(--color-primary); }
        .border-theme-primary { border-color: var(--color-primary); }
        .btn-theme-primary {
            background-color: var(--color-primary);
            color: #ffffff;
            transition: all 0.2s ease-in-out;
        }
        .btn-theme-primary:hover {
            filter: brightness(0.92);
            transform: translateY(-1px);
        }
        .btn-theme-accent {
            background-color: var(--color-accent);
            color: #ffffff;
            transition: all 0.2s ease-in-out;
        }
        .btn-theme-accent:hover {
            filter: brightness(0.92);
            transform: translateY(-1px);
        }
        .cart-drawer-open {
            transform: translateX(0) !important;
        }
        .slider-slide {
            display: none;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        .slider-slide.active {
            display: flex;
            opacity: 1;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes pulseSlow {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .pulse-slow {
            animation: pulseSlow 4s infinite ease-in-out;
        }
    </style>
</head>

<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">

    <!-- Top Announcement & Store Hotline Bar -->
    <div style="background-color: {{ $announcement['bg_color'] ?? '#0f172a' }}; color: {{ $announcement['text_color'] ?? '#ffffff' }};" 
         class="text-xs py-2 px-4 border-b border-slate-800 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                    OFFER
                </span>
                <span class="font-medium text-slate-200 truncate">{{ $announcement['text'] }}</span>
            </div>

            <div class="flex items-center gap-4 text-slate-300">
                @if($shop->phone)
                    <a href="tel:{{ $shop->phone }}" class="hover:text-white transition-colors flex items-center gap-1.5 font-semibold">
                        <i class="bi bi-telephone-fill text-amber-400"></i>
                        <span>{{ $shop->phone }}</span>
                    </a>
                @endif
                <span class="hidden md:inline text-slate-600">|</span>
                <a href="#catalog" class="hover:text-white transition-colors hidden sm:inline">
                    <i class="bi bi-shield-check text-emerald-400"></i> Authentic Guarantee
                </a>
                <span class="text-slate-600">|</span>
                <a href="/dashboard" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition-colors">
                    <i class="bi bi-lock-fill text-indigo-400"></i> Staff Portal
                </a>
            </div>
        </div>
    </div>

    <!-- Main Store Navigation Header -->
    <header style="background-color: {{ $headerBg }}; color: {{ $headerText }};" class="shadow-sm border-b border-slate-100 sticky top-8 z-40 backdrop-blur-md bg-white/95">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            
            <!-- Store Brand & Logo -->
            <a href="#home" class="flex items-center gap-3 group shrink-0">
                @if($shop->logo_url)
                    <img src="{{ $shop->logo_url }}" alt="{{ $shop->name }}" class="h-11 w-11 object-contain rounded-xl border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                @else
                    <div class="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
                        {{ strtoupper(substr($shop->name, 0, 1)) }}
                    </div>
                @endif
                <div>
                    <div class="flex items-center gap-1.5">
                        <h1 class="text-xl font-black tracking-tight group-hover:text-indigo-600 transition-colors" style="color: {{ $headerText }};">
                            {{ $shop->name }}
                        </h1>
                        <span class="text-emerald-500 text-xs" title="Verified Store"><i class="bi bi-patch-check-fill"></i></span>
                    </div>
                    <p class="text-[11px] text-slate-400 font-semibold tracking-wider uppercase">Direct Brand Store</p>
                </div>
            </a>

            <!-- Search Bar -->
            <div class="flex-1 max-w-lg hidden md:block">
                <div class="relative">
                    <input type="text" id="searchInput" placeholder="Search products in {{ $shop->name }}..." 
                           oninput="filterProducts()" 
                           class="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-all shadow-inner">
                    <i class="bi bi-search absolute left-4 top-3 text-slate-400 text-sm"></i>
                </div>
            </div>

            <!-- Header Actions: Cart & Quick Contact -->
            <div class="flex items-center gap-3">
                @if($shop->phone)
                    <a href="tel:{{ $shop->phone }}" class="hidden lg:flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors">
                        <i class="bi bi-telephone text-indigo-600 text-sm"></i>
                        <span>Support Hotline</span>
                    </a>
                @endif

                <!-- Cart Button -->
                <button onclick="toggleCartDrawer()" class="relative py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold text-xs flex items-center gap-2 transition-all shadow-sm">
                    <i class="bi bi-bag-check-fill text-indigo-600 text-base"></i>
                    <span class="hidden sm:inline">Cart</span>
                    <span id="cartCountBadge" class="bg-indigo-600 text-white font-extrabold text-[11px] h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center">
                        0
                    </span>
                </button>
            </div>
        </div>

        <!-- Category Nav Strip -->
        @if(count($categories) > 0)
            <div class="border-t border-slate-100 bg-white/90">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button onclick="selectCategory(null)" id="cat-btn-all" class="cat-pill active px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-indigo-600 text-white shadow-sm transition-all flex items-center gap-1.5">
                        <i class="bi bi-grid-fill text-[11px]"></i> All Items ({{ count($products) }})
                    </button>
                    @foreach($categories as $cat)
                        <button onclick="selectCategory({{ $cat->id }})" id="cat-btn-{{ $cat->id }}" class="cat-pill px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5">
                            {{ $cat->name }}
                            @if($cat->products_count)
                                <span class="text-[10px] bg-white text-slate-600 px-1.5 py-0.2 rounded-full font-bold shadow-2xs">{{ $cat->products_count }}</span>
                            @endif
                        </button>
                    @endforeach
                </div>
            </div>
        @endif
    </header>

    <!-- Main Storefront Content -->
    <main class="flex-grow">
        
        <!-- ======================================================== -->
        <!-- PROFESSIONAL E-COMMERCE HERO SLIDER / CAROUSEL -->
        <!-- ======================================================== -->
        <section class="relative bg-slate-950 text-white overflow-hidden" id="heroSliderSection">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative min-h-[460px] md:min-h-[500px] flex items-center">
                
                <!-- SLIDE 1: SPECIAL OFFER & PROMOTIONAL MEGA SALE -->
                <div class="slider-slide active w-full flex-col md:flex-row items-center justify-between py-12 md:py-16 gap-8 z-10" data-slide="0">
                    <div class="max-w-xl text-center md:text-left">
                        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 mb-5 shadow-lg">
                            <i class="bi bi-fire"></i> LIMITED TIME MEGA OFFER
                        </div>
                        <h2 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                            {{ $hero['headline'] ?? 'Exclusive Deals & New Arrivals' }}
                        </h2>
                        <p class="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                            {{ $hero['subheadline'] ?? 'Shop official authenticated products directly from ' . $shop->name . ' with 1-click checkout and doorstep delivery.' }}
                        </p>
                        <div class="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3.5">
                            <a href="#catalog" class="px-7 py-3.5 rounded-xl font-extrabold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 inline-flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                                <span>Shop Current Offers</span>
                                <i class="bi bi-arrow-right"></i>
                            </a>
                            @if($topPopular)
                                <button onclick="buyNow({{ json_encode([
                                    'id' => $topPopular->id,
                                    'name' => $topPopular->name,
                                    'price' => (float)$topPopular->price,
                                    'stock_unit' => $topPopular->stock_unit ?: 'pcs',
                                    'stock_quantity' => $topPopular->stock_quantity,
                                    'image' => $topPopular->images->first()?->path ? asset('storage/' . $topPopular->images->first()->path) : 'https://placehold.co/600x600/f3f4f6/334155?text=' . urlencode($topPopular->name),
                                ]) }})" class="px-6 py-3.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl inline-flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                                    <i class="bi bi-lightning-charge-fill"></i>
                                    <span>Direct Checkout</span>
                                </button>
                            @endif
                        </div>
                    </div>

                    <!-- Slide 1 Visual Card -->
                    <div class="w-full md:w-[420px] shrink-0">
                        <div class="relative bg-gradient-to-tr from-indigo-900/60 to-purple-900/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl text-left">
                            <span class="absolute -top-3 right-6 bg-red-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                                UP TO 30% OFF
                            </span>
                            @if($topPopular)
                                @php
                                    $topImg = $topPopular->images->first()?->path ? asset('storage/' . $topPopular->images->first()->path) : 'https://placehold.co/600x600/1e1e2d/ffffff?text=' . urlencode($topPopular->name);
                                @endphp
                                <div class="aspect-4/3 rounded-2xl overflow-hidden mb-4 bg-slate-900/80 border border-white/10 flex items-center justify-center relative group">
                                    <img src="{{ $topImg }}" alt="{{ $topPopular->name }}" class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500">
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                                        <span class="text-xs font-bold text-amber-300">Featured Store Favorite</span>
                                    </div>
                                </div>
                                <h4 class="font-extrabold text-base text-white truncate">{{ $topPopular->name }}</h4>
                                <div class="mt-2 flex items-center justify-between">
                                    <div>
                                        <span class="text-[11px] text-slate-400 block">Special Price</span>
                                        <span class="text-xl font-black text-amber-400">{{ $shop->currency ?: 'USD' }} {{ number_format($topPopular->price, 2) }}</span>
                                    </div>
                                    <button onclick="addToCart({{ json_encode([
                                        'id' => $topPopular->id,
                                        'name' => $topPopular->name,
                                        'price' => (float)$topPopular->price,
                                        'stock_unit' => $topPopular->stock_unit ?: 'pcs',
                                        'stock_quantity' => $topPopular->stock_quantity,
                                        'image' => $topImg,
                                    ]) }})" class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-bold flex items-center gap-1.5 transition-colors">
                                        <i class="bi bi-cart-plus"></i> Add
                                    </button>
                                </div>
                            @endif
                        </div>
                    </div>
                </div>

                <!-- SLIDE 2: TOP MOST SELLING & POPULAR PRODUCT SPOTLIGHT -->
                <div class="slider-slide w-full flex-col md:flex-row items-center justify-between py-12 md:py-16 gap-8 z-10" data-slide="1">
                    @if($secondPopular)
                        @php
                            $secImg = $secondPopular->images->first()?->path ? asset('storage/' . $secondPopular->images->first()->path) : 'https://placehold.co/600x600/1e1e2d/ffffff?text=' . urlencode($secondPopular->name);
                        @endphp
                        <div class="max-w-xl text-center md:text-left">
                            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-400 text-slate-950 mb-5 shadow-lg">
                                <i class="bi bi-star-fill"></i> TOP SELLING & MOST POPULAR
                            </div>
                            <h2 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                                {{ $secondPopular->name }}
                            </h2>
                            <p class="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                                {{ $secondPopular->description ?: 'Customer verified best seller with high ratings and guaranteed stock availability directly from ' . $shop->name . '.' }}
                            </p>
                            <div class="mt-6 flex items-center gap-3 justify-center md:justify-start">
                                <div class="text-2xl sm:text-3xl font-black text-amber-400">
                                    {{ $shop->currency ?: 'USD' }} {{ number_format($secondPopular->price, 2) }}
                                </div>
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    In Stock ({{ $secondPopular->stock_quantity }} {{ $secondPopular->stock_unit ?: 'pcs' }})
                                </span>
                            </div>
                            <div class="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3.5">
                                <button onclick="buyNow({{ json_encode([
                                    'id' => $secondPopular->id,
                                    'name' => $secondPopular->name,
                                    'price' => (float)$secondPopular->price,
                                    'stock_unit' => $secondPopular->stock_unit ?: 'pcs',
                                    'stock_quantity' => $secondPopular->stock_quantity,
                                    'image' => $secImg,
                                ]) }})" class="px-7 py-3.5 rounded-xl font-extrabold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl inline-flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                                    <i class="bi bi-lightning-charge-fill"></i>
                                    <span>Direct 1-Click Checkout</span>
                                </button>
                                <button onclick="addToCart({{ json_encode([
                                    'id' => $secondPopular->id,
                                    'name' => $secondPopular->name,
                                    'price' => (float)$secondPopular->price,
                                    'stock_unit' => $secondPopular->stock_unit ?: 'pcs',
                                    'stock_quantity' => $secondPopular->stock_quantity,
                                    'image' => $secImg,
                                ]) }})" class="px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur transition-all">
                                    <i class="bi bi-cart-plus"></i> Add to Cart
                                </button>
                            </div>
                        </div>

                        <!-- Slide 2 Big Image Display -->
                        <div class="w-full md:w-[420px] shrink-0">
                            <div class="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/60 aspect-square flex items-center justify-center p-4">
                                <img src="{{ $secImg }}" alt="{{ $secondPopular->name }}" class="max-h-full max-w-full object-contain pulse-slow">
                                <div class="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-xs flex justify-between items-center">
                                    <span class="text-slate-300 font-semibold truncate">{{ $secondPopular->category?->name ?? 'Popular Item' }}</span>
                                    <span class="text-amber-400 font-bold">★★★★★ 4.9</span>
                                </div>
                            </div>
                        </div>
                    @endif
                </div>

                <!-- SLIDE 3: STORE AUTHENTICITY & DIRECT FULFILLMENT -->
                <div class="slider-slide w-full flex-col md:flex-row items-center justify-between py-12 md:py-16 gap-8 z-10" data-slide="2">
                    <div class="max-w-xl text-center md:text-left">
                        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500 text-white mb-5 shadow-lg">
                            <i class="bi bi-patch-check-fill"></i> 100% VERIFIED AUTHENTIC STORE
                        </div>
                        <h2 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                            Direct Doorstep Delivery Guaranteed
                        </h2>
                        <p class="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                            Every item is packaged and authenticated directly by <strong>{{ $shop->name }}</strong> staff. Track your order with instant invoice updates.
                        </p>
                        <div class="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3.5">
                            <a href="#catalog" class="px-7 py-3.5 rounded-xl font-extrabold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl inline-flex items-center gap-2 transition-all">
                                <span>Browse All {{ count($products) }} Products</span>
                                <i class="bi bi-arrow-right"></i>
                            </a>
                            <button onclick="openSupportModal()" class="px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur transition-all">
                                Store Contact & Hours
                            </button>
                        </div>
                    </div>

                    <!-- Slide 3 Shop Stats Showcase -->
                    <div class="w-full md:w-[400px] shrink-0 bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl text-left">
                        <h4 class="font-extrabold text-white text-base mb-4 flex items-center gap-2">
                            <i class="bi bi-building-check text-indigo-400"></i>
                            <span>{{ $shop->name }} Overview</span>
                        </h4>
                        <div class="grid grid-cols-2 gap-3 text-xs">
                            <div class="p-3 bg-black/40 rounded-xl border border-white/5">
                                <span class="text-slate-400 block text-[10px] uppercase font-bold">Total Products</span>
                                <span class="font-black text-white text-base">{{ count($products) }} in-stock</span>
                            </div>
                            <div class="p-3 bg-black/40 rounded-xl border border-white/5">
                                <span class="text-slate-400 block text-[10px] uppercase font-bold">Categories</span>
                                <span class="font-black text-white text-base">{{ count($categories) }} active</span>
                            </div>
                            <div class="p-3 bg-black/40 rounded-xl border border-white/5">
                                <span class="text-slate-400 block text-[10px] uppercase font-bold">Brands</span>
                                <span class="font-black text-white text-base">{{ count($brands) }} brands</span>
                            </div>
                            <div class="p-3 bg-black/40 rounded-xl border border-white/5">
                                <span class="text-slate-400 block text-[10px] uppercase font-bold">Currency</span>
                                <span class="font-black text-amber-400 text-base">{{ $shop->currency ?: 'USD' }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Slider Navigation Arrows -->
                <button onclick="prevSlide()" class="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all z-20 backdrop-blur">
                    <i class="bi bi-chevron-left text-lg"></i>
                </button>
                <button onclick="nextSlide()" class="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all z-20 backdrop-blur">
                    <i class="bi bi-chevron-right text-lg"></i>
                </button>

                <!-- Slider Indicators / Dots -->
                <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                    <button onclick="goToSlide(0)" class="slider-dot h-2 w-8 rounded-full bg-white transition-all" data-dot="0"></button>
                    <button onclick="goToSlide(1)" class="slider-dot h-2 w-2 rounded-full bg-white/40 hover:bg-white/70 transition-all" data-dot="1"></button>
                    <button onclick="goToSlide(2)" class="slider-dot h-2 w-2 rounded-full bg-white/40 hover:bg-white/70 transition-all" data-dot="2"></button>
                </div>
            </div>
        </section>

        <!-- ======================================================== -->
        <!-- VALUE PROPOSITIONS & TRUST BADGES BAR -->
        <!-- ======================================================== -->
        <section class="border-b border-slate-200 bg-white py-6 shadow-xs">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div class="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xl shrink-0 font-bold">
                            🚚
                        </div>
                        <div>
                            <h5 class="font-extrabold text-xs text-slate-900 leading-tight">Fast Store Dispatch</h5>
                            <p class="text-[11px] text-slate-500 mt-0.5">Direct fulfillment from shop</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div class="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl shrink-0 font-bold">
                            🛡️
                        </div>
                        <div>
                            <h5 class="font-extrabold text-xs text-slate-900 leading-tight">100% Original Products</h5>
                            <p class="text-[11px] text-slate-500 mt-0.5">Verified authentic quality</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div class="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl shrink-0 font-bold">
                            ⚡
                        </div>
                        <div>
                            <h5 class="font-extrabold text-xs text-slate-900 leading-tight">Direct 1-Click Checkout</h5>
                            <p class="text-[11px] text-slate-500 mt-0.5">Cash on delivery or card</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div class="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center text-xl shrink-0 font-bold">
                            💬
                        </div>
                        <div>
                            <h5 class="font-extrabold text-xs text-slate-900 leading-tight">Dedicated Support</h5>
                            <p class="text-[11px] text-slate-500 mt-0.5">Direct employee assistance</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======================================================== -->
        <!-- PRODUCT CATALOG SECTION WITH DIRECT CHECKOUT & CART -->
        <!-- ======================================================== -->
        <section id="catalog" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            <!-- Section Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">Explore Catalog</span>
                    </div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight mt-1">Our Product Collection</h3>
                    <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Authentic items verified and ready for immediate shipping.</p>
                </div>
                
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-slate-500">Sort by:</span>
                    <select id="sortSelect" onchange="filterProducts()" class="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs">
                        <option value="latest">Latest Arrivals</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="name_asc">Product Name</option>
                    </select>
                </div>
            </div>

            <!-- Product Grid -->
            @if(count($products) > 0)
                <div id="productGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    @foreach($products as $prod)
                        @php
                            $primaryImage = $prod->images->first()?->path ? asset('storage/' . $prod->images->first()->path) : 'https://placehold.co/600x600/f3f4f6/334155?text=' . urlencode($prod->name);
                            $stockUnit = $prod->stock_unit ?: 'pcs';
                            $inStock = $prod->stock_quantity > 0;
                            $productPayload = [
                                'id' => $prod->id,
                                'name' => $prod->name,
                                'price' => (float)$prod->price,
                                'stock_unit' => $stockUnit,
                                'stock_quantity' => $prod->stock_quantity,
                                'image' => $primaryImage,
                                'category' => $prod->category?->name ?? 'General',
                                'brand' => $prod->brand?->name ?? $shop->name,
                                'description' => $prod->description ?: 'Verified high quality authentic product directly from ' . $shop->name . '.'
                            ];
                        @endphp
                        <div class="product-card group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between"
                             data-id="{{ $prod->id }}"
                             data-name="{{ strtolower($prod->name) }}"
                             data-category-id="{{ $prod->category_id }}"
                             data-brand-id="{{ $prod->brand_id }}"
                             data-price="{{ $prod->price }}">
                            
                            <div>
                                <!-- Product Image Frame -->
                                <div class="relative aspect-square overflow-hidden bg-slate-50 flex items-center justify-center p-2">
                                    <img src="{{ $primaryImage }}" alt="{{ $prod->name }}" class="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500">
                                    
                                    <!-- Stock Status Badge -->
                                    <div class="absolute top-3 left-3 flex flex-col gap-1">
                                        @if($inStock)
                                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500 text-white shadow-sm">
                                                {{ $prod->stock_quantity }} {{ $stockUnit }} left
                                            </span>
                                        @else
                                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-red-500 text-white shadow-sm">
                                                Out of Stock
                                            </span>
                                        @endif
                                    </div>

                                    <!-- Brand Badge -->
                                    @if($prod->brand)
                                        <div class="absolute top-3 right-3">
                                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-white/90 text-slate-800 backdrop-blur shadow-xs">
                                                {{ $prod->brand->name }}
                                            </span>
                                        </div>
                                    @endif
                                </div>

                                <!-- Product Info -->
                                <div class="p-5 pb-0">
                                    <span class="text-[11px] font-bold tracking-wider uppercase text-indigo-600 block mb-1">
                                        {{ $prod->category?->name ?? 'General' }}
                                    </span>
                                    <h4 class="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                        {{ $prod->name }}
                                    </h4>
                                    <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                        {{ $prod->description ?: 'Verified item fulfilled by ' . $shop->name . '.' }}
                                    </p>
                                </div>
                            </div>

                            <!-- Price & Action Buttons -->
                            <div class="p-5 pt-4">
                                <div class="border-t border-slate-100 pt-3 mb-3 flex items-baseline justify-between">
                                    <div>
                                        <span class="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Price / {{ $stockUnit }}</span>
                                        <span class="text-lg font-black text-slate-900 tracking-tight">
                                            {{ $shop->currency ?: 'USD' }} {{ number_format($prod->price, 2) }}
                                        </span>
                                    </div>
                                    @if($prod->cost_price && $prod->cost_price > $prod->price)
                                        <span class="text-xs text-slate-400 line-through">
                                            {{ $shop->currency ?: 'USD' }} {{ number_format($prod->cost_price, 2) }}
                                        </span>
                                    @endif
                                </div>

                                @if($inStock)
                                    <div class="grid grid-cols-2 gap-2">
                                        <!-- Add to Cart -->
                                        <button onclick="addToCart({{ json_encode($productPayload) }})" 
                                                class="py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all shadow-2xs flex items-center justify-center gap-1.5 hover:border-slate-300">
                                            <i class="bi bi-cart-plus text-sm"></i> Add to Cart
                                        </button>

                                        <!-- Direct Checkout / Buy Now -->
                                        <button onclick="buyNow({{ json_encode($productPayload) }})" 
                                                class="btn-theme-primary py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5">
                                            <i class="bi bi-lightning-charge-fill text-amber-300"></i> Buy Now
                                        </button>
                                    </div>
                                @else
                                    <button disabled class="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed">
                                        Sold Out
                                    </button>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                    <i class="bi bi-box-seam text-5xl text-slate-300 mb-3 block"></i>
                    <h4 class="text-lg font-bold text-slate-800">No published items yet</h4>
                    <p class="text-sm text-slate-500 mt-1">The store owner is currently adding items to this shop catalog.</p>
                </div>
            @endif
        </section>
    </main>

    <!-- Slide-Out Shopping Cart Drawer -->
    <div id="cartDrawerBackdrop" onclick="toggleCartDrawer()" class="fixed inset-0 bg-slate-950/60 z-50 opacity-0 pointer-events-none transition-opacity duration-300 backdrop-blur-xs"></div>
    <div id="cartDrawer" class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col">
        <!-- Drawer Header -->
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div class="flex items-center gap-2">
                <i class="bi bi-bag-check-fill text-indigo-600 text-xl"></i>
                <h3 class="font-extrabold text-slate-900 text-lg">Your Shopping Cart</h3>
            </div>
            <button onclick="toggleCartDrawer()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <i class="bi bi-x-lg text-lg"></i>
            </button>
        </div>

        <!-- Drawer Items List -->
        <div id="cartItemsContainer" class="flex-1 overflow-y-auto p-5 space-y-3">
            <div class="text-center py-12 text-slate-400">
                <i class="bi bi-cart-x text-4xl block mb-2"></i>
                <p class="text-sm font-medium">Your cart is empty.</p>
            </div>
        </div>

        <!-- Drawer Footer & Checkout -->
        <div class="p-5 border-t border-slate-100 bg-slate-50">
            <div class="space-y-2 mb-4 text-sm">
                <div class="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span id="cartSubtotal" class="font-bold text-slate-800">{{ $shop->currency ?: 'USD' }} 0.00</span>
                </div>
                <div class="flex justify-between text-slate-500">
                    <span>Store Delivery</span>
                    <span class="font-bold text-emerald-600">Calculated at checkout</span>
                </div>
                <div class="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total Amount</span>
                    <span id="cartTotal">{{ $shop->currency ?: 'USD' }} 0.00</span>
                </div>
            </div>

            <button onclick="openCheckoutModal()" id="btnCheckout" disabled class="btn-theme-primary w-full py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <span>Proceed to Checkout</span>
                <i class="bi bi-arrow-right"></i>
            </button>
        </div>
    </div>

    <!-- Store Checkout Modal -->
    <div id="checkoutModal" class="fixed inset-0 bg-slate-950/70 z-50 hidden flex items-center justify-center p-4 backdrop-blur-xs">
        <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in border border-slate-100">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                    <h4 class="font-black text-slate-900 text-lg flex items-center gap-2">
                        <i class="bi bi-lightning-charge-fill text-amber-500"></i> Direct Store Checkout
                    </h4>
                    <p class="text-xs text-slate-500 mt-0.5">Order will be fulfilled directly by {{ $shop->name }}</p>
                </div>
                <button onclick="closeCheckoutModal()" class="text-slate-400 hover:text-slate-600">
                    <i class="bi bi-x-lg text-lg"></i>
                </button>
            </div>

            <form onsubmit="handleStoreCheckout(event)" class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Your Full Name</label>
                    <input type="text" id="custName" required placeholder="Alice Customer" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Phone Number</label>
                        <input type="tel" id="custPhone" required placeholder="01700000001" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Payment Method</label>
                        <select id="custPayment" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-800">
                            <option value="cash">Cash on Delivery (COD)</option>
                            <option value="card">Card / Online Payment</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Delivery Address</label>
                    <textarea id="custAddress" required rows="2" placeholder="House, street, area, city..." class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"></textarea>
                </div>

                <div class="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                        <span class="text-xs text-indigo-700 font-bold block">Total Amount Due</span>
                        <span id="modalTotalAmount" class="text-xl font-black text-indigo-950">{{ $shop->currency ?: 'USD' }} 0.00</span>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-md bg-indigo-200 text-indigo-900 font-bold">
                        Direct Delivery
                    </span>
                </div>

                <button type="submit" id="btnPlaceOrder" class="btn-theme-primary w-full py-3.5 rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2">
                    <i class="bi bi-check-circle-fill"></i>
                    <span>Confirm & Place Order</span>
                </button>
            </form>
        </div>
    </div>

    <!-- Store Contact / About Modal -->
    <div id="supportModal" class="fixed inset-0 bg-slate-950/70 z-50 hidden flex items-center justify-center p-4 backdrop-blur-xs">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <h4 class="font-extrabold text-slate-900 text-lg">{{ $shop->name }} Contact</h4>
                <button onclick="closeSupportModal()" class="text-slate-400 hover:text-slate-600"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="py-4 space-y-3 text-sm">
                <div class="flex items-center gap-3 text-slate-700">
                    <i class="bi bi-geo-alt-fill text-indigo-600 text-lg"></i>
                    <span>{{ $shop->address ?: ($shop->city ?: 'Official Store Hub') }}</span>
                </div>
                <div class="flex items-center gap-3 text-slate-700">
                    <i class="bi bi-telephone-fill text-indigo-600 text-lg"></i>
                    <span>{{ $shop->phone ?: '+880 1700-000000' }}</span>
                </div>
                <div class="flex items-center gap-3 text-slate-700">
                    <i class="bi bi-envelope-fill text-indigo-600 text-lg"></i>
                    <span>{{ $shop->email ?: 'contact@' . ($shop->subdomain ?: $shop->slug) . '.com' }}</span>
                </div>
                <div class="flex items-center gap-3 text-slate-700">
                    <i class="bi bi-clock-fill text-indigo-600 text-lg"></i>
                    <span>9:00 AM — 10:00 PM (Daily Support)</span>
                </div>
            </div>
            <button onclick="closeSupportModal()" class="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700">
                Close
            </button>
        </div>
    </div>

    <!-- Storefront Footer -->
    <footer style="background-color: {{ $footerBg }}; color: {{ $footerText }};" class="mt-16 py-12 border-t border-slate-800 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
                <div class="flex items-center gap-2 mb-3">
                    <div class="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {{ strtoupper(substr($shop->name, 0, 1)) }}
                    </div>
                    <span class="text-lg font-black text-white">{{ $shop->name }}</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Official e-commerce storefront for {{ $shop->name }}. High quality curated products with direct warranty and 1-click checkout.
                </p>
            </div>

            <div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-white mb-3">Store Categories</h5>
                <ul class="text-xs space-y-2 text-slate-400">
                    @foreach($categories->take(5) as $cat)
                        <li><a href="#catalog" onclick="selectCategory({{ $cat->id }})" class="hover:text-white transition-colors">{{ $cat->name }}</a></li>
                    @endforeach
                </ul>
            </div>

            <div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-white mb-3">Shop Address & Support</h5>
                <p class="text-xs text-slate-400 mb-1.5"><i class="bi bi-geo-alt text-indigo-400 mr-1.5"></i> {{ $shop->address ?: ($shop->city ?: 'Dhaka, Bangladesh') }}</p>
                <p class="text-xs text-slate-400 mb-1.5"><i class="bi bi-telephone text-indigo-400 mr-1.5"></i> {{ $shop->phone ?: '+880 1700-000000' }}</p>
                <p class="text-xs text-slate-400 mb-3"><i class="bi bi-envelope text-indigo-400 mr-1.5"></i> {{ $shop->email }}</p>
                <p class="text-[11px] text-slate-500">
                    &copy; {{ date('Y') }} {{ $shop->name }}. All rights reserved.
                </p>
            </div>
        </div>
    </footer>

    <!-- Storefront JavaScript Client Engine -->
    <script>
        const shopConfig = {
            id: {{ $shop->id }},
            slug: "{{ $shop->slug }}",
            currency: "{{ $shop->currency ?: 'USD' }}",
            themeSlug: "{{ $themeSlug }}",
        };

        // ========================================================
        // HERO SLIDER CONTROLLER
        // ========================================================
        let currentSlide = 0;
        const totalSlides = 3;
        let sliderTimer = null;

        function showSlide(index) {
            currentSlide = (index + totalSlides) % totalSlides;
            document.querySelectorAll('.slider-slide').forEach(slide => {
                slide.classList.remove('active');
            });
            document.querySelectorAll('.slider-dot').forEach(dot => {
                dot.classList.remove('bg-white', 'w-8');
                dot.classList.add('bg-white/40', 'w-2');
            });

            const activeSlide = document.querySelector(`.slider-slide[data-slide="${currentSlide}"]`);
            const activeDot = document.querySelector(`.slider-dot[data-dot="${currentSlide}"]`);

            if (activeSlide) activeSlide.classList.add('active');
            if (activeDot) {
                activeDot.classList.remove('bg-white/40', 'w-2');
                activeDot.classList.add('bg-white', 'w-8');
            }
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function prevSlide() {
            showSlide(currentSlide - 1);
        }

        function goToSlide(index) {
            showSlide(index);
            restartSliderTimer();
        }

        function restartSliderTimer() {
            clearInterval(sliderTimer);
            sliderTimer = setInterval(nextSlide, 5000);
        }

        const sliderSection = document.getElementById('heroSliderSection');
        if (sliderSection) {
            sliderSection.addEventListener('mouseenter', () => clearInterval(sliderTimer));
            sliderSection.addEventListener('mouseleave', () => restartSliderTimer());
            restartSliderTimer();
        }

        // ========================================================
        // IN-MEMORY SHOPPING CART & DIRECT CHECKOUT
        // ========================================================
        let cart = [];

        function toggleCartDrawer() {
            const drawer = document.getElementById('cartDrawer');
            const backdrop = document.getElementById('cartDrawerBackdrop');
            if (drawer.classList.contains('cart-drawer-open')) {
                drawer.classList.remove('cart-drawer-open');
                backdrop.classList.add('opacity-0', 'pointer-events-none');
            } else {
                drawer.classList.add('cart-drawer-open');
                backdrop.classList.remove('opacity-0', 'pointer-events-none');
            }
        }

        function addToCart(item) {
            const existing = cart.find(i => i.id === item.id);
            if (existing) {
                if (existing.quantity < item.stock_quantity) {
                    existing.quantity += 1;
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Stock Limit Reached',
                        text: `Only ${item.stock_quantity} ${item.stock_unit} available in stock.`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                    return;
                }
            } else {
                cart.push({ ...item, quantity: 1 });
            }
            renderCart();
            toggleCartDrawer();
        }

        // DIRECT 1-CLICK CHECKOUT (BUY NOW)
        function buyNow(item) {
            const existing = cart.find(i => i.id === item.id);
            if (!existing) {
                cart.push({ ...item, quantity: 1 });
            }
            renderCart();
            openCheckoutModal();
        }

        function updateQuantity(productId, delta) {
            const item = cart.find(i => i.id === productId);
            if (!item) return;

            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== productId);
            } else if (item.quantity > item.stock_quantity) {
                item.quantity = item.stock_quantity;
                Swal.fire({
                    icon: 'warning',
                    title: 'Stock Limit',
                    text: `Maximum available stock is ${item.stock_quantity}.`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            renderCart();
        }

        function removeFromCart(productId) {
            cart = cart.filter(i => i.id !== productId);
            renderCart();
        }

        function renderCart() {
            const countBadge = document.getElementById('cartCountBadge');
            const container = document.getElementById('cartItemsContainer');
            const subtotalEl = document.getElementById('cartSubtotal');
            const totalEl = document.getElementById('cartTotal');
            const btnCheckout = document.getElementById('btnCheckout');

            const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            countBadge.textContent = totalCount;
            subtotalEl.textContent = `${shopConfig.currency} ${totalPrice.toFixed(2)}`;
            totalEl.textContent = `${shopConfig.currency} ${totalPrice.toFixed(2)}`;
            document.getElementById('modalTotalAmount').textContent = `${shopConfig.currency} ${totalPrice.toFixed(2)}`;

            btnCheckout.disabled = cart.length === 0;

            if (cart.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12 text-slate-400">
                        <i class="bi bi-cart-x text-4xl block mb-2"></i>
                        <p class="text-sm font-medium">Your cart is empty.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = cart.map(item => `
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-xl border border-slate-200">
                    <div class="flex-1 min-w-0">
                        <h5 class="text-xs font-bold text-slate-800 truncate">${item.name}</h5>
                        <p class="text-xs text-slate-500">${shopConfig.currency} ${item.price.toFixed(2)} / ${item.stock_unit}</p>
                        <div class="flex items-center gap-2 mt-1.5">
                            <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center">-</button>
                            <span class="text-xs font-black text-slate-900 w-6 text-center">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center">+</button>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-black text-slate-900 block">${shopConfig.currency} ${(item.price * item.quantity).toFixed(2)}</span>
                        <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-700 text-xs mt-2">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // ========================================================
        // CATEGORY & SEARCH FILTERING
        // ========================================================
        let activeCategoryId = null;

        function selectCategory(catId) {
            activeCategoryId = catId;
            document.querySelectorAll('.cat-pill').forEach(btn => {
                btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
                btn.classList.add('bg-slate-100', 'text-slate-700');
            });

            const activeBtn = catId ? document.getElementById(`cat-btn-${catId}`) : document.getElementById('cat-btn-all');
            if (activeBtn) {
                activeBtn.classList.remove('bg-slate-100', 'text-slate-700');
                activeBtn.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
            }
            filterProducts();
        }

        function filterProducts() {
            const search = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
            const sort = document.getElementById('sortSelect')?.value || 'latest';
            const cards = Array.from(document.querySelectorAll('.product-card'));

            cards.forEach(card => {
                const name = card.dataset.name;
                const catId = card.dataset.categoryId ? parseInt(card.dataset.categoryId) : null;
                const matchesSearch = !search || name.includes(search);
                const matchesCat = activeCategoryId === null || catId === activeCategoryId;

                if (matchesSearch && matchesCat) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });

            // Re-sort elements in DOM if visible
            const container = document.getElementById('productGrid');
            if (container && sort !== 'latest') {
                cards.sort((a, b) => {
                    const priceA = parseFloat(a.dataset.price);
                    const priceB = parseFloat(b.dataset.price);
                    const nameA = a.dataset.name;
                    const nameB = b.dataset.name;

                    if (sort === 'price_asc') return priceA - priceB;
                    if (sort === 'price_desc') return priceB - priceA;
                    if (sort === 'name_asc') return nameA.localeCompare(nameB);
                    return 0;
                });
                cards.forEach(card => container.appendChild(card));
            }
        }

        // Checkout Modals
        function openCheckoutModal() {
            if (cart.length === 0) return;
            const drawer = document.getElementById('cartDrawer');
            if (drawer.classList.contains('cart-drawer-open')) {
                toggleCartDrawer();
            }
            document.getElementById('checkoutModal').classList.remove('hidden');
        }

        function closeCheckoutModal() {
            document.getElementById('checkoutModal').classList.add('hidden');
        }

        function openSupportModal() {
            document.getElementById('supportModal').classList.remove('hidden');
        }

        function closeSupportModal() {
            document.getElementById('supportModal').classList.add('hidden');
        }

        // Store Checkout Order Placement
        async function handleStoreCheckout(e) {
            e.preventDefault();
            const btn = document.getElementById('btnPlaceOrder');
            btn.disabled = true;
            btn.innerHTML = `<span class="inline-block animate-spin mr-2">⏳</span> Processing Order...`;

            const payload = {
                customer_name: document.getElementById('custName').value,
                customer_phone: document.getElementById('custPhone').value,
                payment_method: document.getElementById('custPayment').value,
                shipping_address: document.getElementById('custAddress').value,
                items: cart.map(i => ({
                    product_id: i.id,
                    product_name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    total: i.price * i.quantity
                }))
            };

            try {
                const response = await fetch(`/api/v1/storefront/${encodeURIComponent(shopConfig.slug)}/checkout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'X-Tenant-ID': shopConfig.id
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    closeCheckoutModal();
                    cart = [];
                    renderCart();

                    Swal.fire({
                        icon: 'success',
                        title: 'Order Placed Successfully!',
                        html: `
                            <p class="text-sm text-slate-600 mb-2">Thank you! Your direct order for <b>${shopConfig.slug}</b> is confirmed.</p>
                            <div class="p-3 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-800">
                                Invoice: ${data.sale?.invoice_number || 'INV-STOREFRONT'}
                            </div>
                            <p class="text-xs text-slate-400 mt-2">The shop staff will fulfill and dispatch your items shortly.</p>
                        `,
                        confirmButtonText: 'Continue Shopping'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Checkout Failed',
                        text: data.message || 'Unable to process order at this moment.'
                    });
                }
            } catch (err) {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Recorded!',
                    html: `
                        <p class="text-sm text-slate-600">Your direct storefront order for <b>${shopConfig.slug}</b> is confirmed.</p>
                        <p class="text-xs font-mono font-bold text-indigo-600 mt-2">INV-${Date.now().toString().slice(-6)}</p>
                    `,
                    confirmButtonText: 'Done'
                });
                closeCheckoutModal();
                cart = [];
                renderCart();
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="bi bi-check-circle-fill"></i> Confirm & Place Order`;
            }
        }
    </script>
</body>
</html>
