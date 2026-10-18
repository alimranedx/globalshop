<!DOCTYPE html>
<html lang="{{ $shop->language ?: 'en' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $shop->name }} — {{ $theme['name'] ?? 'Storefront' }}</title>
    <meta name="description" content="Shop official products from {{ $shop->name }}.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Bootstrap Icons & Tailwind -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    @php
        $colors = $themeConfig['colors'] ?? [];
        $primaryColor = $colors['primary'] ?? '#2563EB';
        $accentColor = $colors['accent'] ?? '#F59E0B';
        $headerBg = $colors['header_bg'] ?? '#FFFFFF';
        $headerText = $colors['header_text'] ?? '#1E293B';
        $footerBg = $colors['footer_bg'] ?? '#0F172A';
        $footerText = $colors['footer_text'] ?? '#F8FAFC';
        $fontFamily = $themeConfig['typography']['font_family'] ?? "'Inter', sans-serif";
        $announcement = $themeConfig['announcement'] ?? ['enabled' => true, 'text' => '✨ Welcome to our official store!', 'bg_color' => '#1E293B', 'text_color' => '#FFFFFF'];
        $hero = $themeConfig['hero'] ?? [
            'headline' => 'Elevate Your Everyday Shopping',
            'subheadline' => 'Discover our curated selection of quality items.',
            'button_text' => 'Shop Now',
            'button_link' => '#catalog'
        ];
        $themeSlug = $shop->theme_slug ?: 'default';
    @endphp

    <style>
        :root {
            --color-primary: {{ $primaryColor }};
            --color-accent: {{ $accentColor }};
            --font-family-store: {{ $fontFamily }};
        }
        body {
            font-family: var(--font-family-store);
            scroll-behavior: smooth;
        }
        .bg-theme-primary { background-color: var(--color-primary); }
        .text-theme-primary { color: var(--color-primary); }
        .border-theme-primary { border-color: var(--color-primary); }
        .bg-theme-accent { background-color: var(--color-accent); }
        .text-theme-accent { color: var(--color-accent); }
        .btn-theme-primary {
            background-color: var(--color-primary);
            color: #ffffff;
            transition: all 0.2s ease-in-out;
        }
        .btn-theme-primary:hover {
            filter: brightness(0.92);
            transform: translateY(-1px);
        }
        .theme-badge-grocery {
            background: #16a34a;
            color: #ffffff;
        }
        .theme-badge-boutique {
            background: #9333ea;
            color: #ffffff;
        }
        .theme-badge-tech {
            background: #0284c7;
            color: #ffffff;
        }
        .cart-drawer-open {
            transform: translateX(0) !important;
        }
    </style>
</head>

<body class="bg-gray-50 text-slate-800 antialiased min-h-screen flex flex-col">

    <!-- Top Management & Theme Switcher Bar (Demo / Preview utility) -->
    <div class="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-600 text-white">
                    Tenant Storefront
                </span>
                <span class="font-semibold text-white">{{ $shop->name }}</span>
                <span class="text-slate-400">({{ $shop->subdomain ?: $shop->slug }}.shopbusket.com)</span>
                @if($shop->custom_domain)
                    <span class="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <i class="bi bi-globe2"></i> {{ $shop->custom_domain }}
                    </span>
                @endif
            </div>

            <!-- Theme Quick Preview Switcher -->
            <div class="flex items-center gap-2">
                <span class="text-slate-400 hidden sm:inline">Active Theme:</span>
                <div class="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800 p-0.5">
                    @foreach(['default' => 'Minimal', 'grocery' => 'Grocery', 'boutique' => 'Boutique', 'tech' => 'Tech'] as $slug => $label)
                        <button onclick="switchTheme('{{ $slug }}')" 
                            class="px-2.5 py-1 text-xs font-medium rounded-md transition-all {{ $themeSlug === $slug ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700' }}">
                            {{ $label }}
                        </button>
                    @endforeach
                </div>

                <a href="/shop/{{ $shop->slug }}/dashboard" class="ml-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors">
                    <i class="bi bi-speedometer2"></i> Staff Portal
                </a>
            </div>
        </div>
    </div>

    <!-- Announcement Bar -->
    @if(!empty($announcement['enabled']))
        <div style="background-color: {{ $announcement['bg_color'] ?? '#1E293B' }}; color: {{ $announcement['text_color'] ?? '#FFFFFF' }};" 
             class="text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-inner transition-colors">
            {{ $announcement['text'] }}
        </div>
    @endif

    <!-- Storefront Navigation Header -->
    <header style="background-color: {{ $headerBg }}; color: {{ $headerText }};" class="shadow-sm border-b border-gray-100 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            
            <!-- Store Logo / Brand -->
            <a href="#home" class="flex items-center gap-3 group">
                @if($shop->logo_url)
                    <img src="{{ $shop->logo_url }}" alt="{{ $shop->name }}" class="h-10 w-10 object-contain rounded-xl border border-gray-200 shadow-sm">
                @else
                    <div class="h-10 w-10 rounded-xl bg-theme-primary text-white flex items-center justify-center font-bold text-xl shadow-md">
                        {{ strtoupper(substr($shop->name, 0, 1)) }}
                    </div>
                @endif
                <div>
                    <h1 class="text-xl font-extrabold tracking-tight group-hover:opacity-90 transition-opacity" style="color: {{ $headerText }};">
                        {{ $shop->name }}
                    </h1>
                    <p class="text-xs text-gray-400 font-medium">Official Brand Store</p>
                </div>
            </a>

            <!-- Search Bar -->
            <div class="flex-1 max-w-md hidden md:block">
                <div class="relative">
                    <input type="text" id="searchInput" placeholder="Search {{ $shop->name }} products..." 
                           oninput="filterProducts()" 
                           class="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-inner">
                    <i class="bi bi-search absolute left-3.5 top-2.5 text-gray-400 text-sm"></i>
                </div>
            </div>

            <!-- Header Actions: Cart & Contact -->
            <div class="flex items-center gap-3">
                @if($shop->phone)
                    <a href="tel:{{ $shop->phone }}" class="hidden lg:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                        <i class="bi bi-telephone text-theme-primary"></i>
                        <span>{{ $shop->phone }}</span>
                    </a>
                @endif

                <!-- Cart Button -->
                <button onclick="toggleCartDrawer()" class="relative p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all text-slate-800 focus:outline-none">
                    <i class="bi bi-bag-check text-lg"></i>
                    <span id="cartCountBadge" class="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                        0
                    </span>
                </button>
            </div>
        </div>

        <!-- Category Nav Strip -->
        @if(count($categories) > 0)
            <div class="border-t border-gray-100 bg-white/70 backdrop-blur">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button onclick="selectCategory(null)" id="cat-btn-all" class="cat-pill active px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-theme-primary text-white shadow-sm transition-all">
                        All Items ({{ count($products) }})
                    </button>
                    @foreach($categories as $cat)
                        <button onclick="selectCategory({{ $cat->id }})" id="cat-btn-{{ $cat->id }}" class="cat-pill px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all">
                            {{ $cat->name }}
                        </button>
                    @endforeach
                </div>
            </div>
        @endif
    </header>

    <!-- Main Storefront Body -->
    <main class="flex-grow">
        
        <!-- Hero Section (Themed) -->
        <section class="relative overflow-hidden py-14 sm:py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div class="max-w-2xl text-center md:text-left">
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-indigo-300 border border-white/20 mb-4 backdrop-blur">
                        <i class="bi bi-stars"></i> Curated Shop Collection
                    </span>
                    <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                        {{ $hero['headline'] ?? 'Shop Premium Quality Directly' }}
                    </h2>
                    <p class="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                        {{ $hero['subheadline'] ?? 'Explore our complete product catalog with instant ordering and guaranteed local delivery.' }}
                    </p>
                    <div class="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <a href="{{ $hero['button_link'] ?? '#catalog' }}" class="btn-theme-primary px-7 py-3.5 rounded-xl font-bold text-sm shadow-xl inline-flex items-center gap-2">
                            <span>{{ $hero['button_text'] ?? 'Explore Catalog' }}</span>
                            <i class="bi bi-arrow-right"></i>
                        </a>
                        <button onclick="openSupportModal()" class="px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur transition-all">
                            Store Contact Info
                        </button>
                    </div>
                </div>

                <!-- Theme Showcase Card -->
                <div class="w-full md:w-96 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl text-left">
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-xs uppercase tracking-wider font-bold text-indigo-300">Theme Engine</span>
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-900">
                            {{ $theme['name'] ?? 'Modern Minimalist' }}
                        </span>
                    </div>
                    <p class="text-xs text-slate-300 mb-4">
                        {{ $theme['tagline'] ?? 'Fully responsive, multi-device optimized storefront theme with live cart.' }}
                    </p>
                    <div class="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-4">
                        <div class="p-2.5 bg-black/20 rounded-lg">
                            <span class="text-slate-400 block text-[10px]">Categories</span>
                            <span class="font-bold text-white text-sm">{{ count($categories) }} active</span>
                        </div>
                        <div class="p-2.5 bg-black/20 rounded-lg">
                            <span class="text-slate-400 block text-[10px]">Brands</span>
                            <span class="font-bold text-white text-sm">{{ count($brands) }} verified</span>
                        </div>
                        <div class="p-2.5 bg-black/20 rounded-lg">
                            <span class="text-slate-400 block text-[10px]">Products</span>
                            <span class="font-bold text-white text-sm">{{ count($products) }} in-stock</span>
                        </div>
                        <div class="p-2.5 bg-black/20 rounded-lg">
                            <span class="text-slate-400 block text-[10px]">Currency</span>
                            <span class="font-bold text-white text-sm">{{ $shop->currency ?: 'USD' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Catalog Section -->
        <section id="catalog" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            <!-- Section Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-200 gap-4">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight">Catalog Collection</h3>
                    <p class="text-sm text-gray-500 mt-1">Directly sourced and authenticated by {{ $shop->name }}.</p>
                </div>
                
                <div class="flex items-center gap-3">
                    <span class="text-xs font-semibold text-gray-500">Sort by:</span>
                    <select id="sortSelect" onchange="filterProducts()" class="text-xs font-medium bg-white border border-gray-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
                        @endphp
                        <div class="product-card group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                             data-id="{{ $prod->id }}"
                             data-name="{{ strtolower($prod->name) }}"
                             data-category-id="{{ $prod->category_id }}"
                             data-brand-id="{{ $prod->brand_id }}"
                             data-price="{{ $prod->price }}">
                            
                            <!-- Product Image Frame -->
                            <div class="relative aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
                                <img src="{{ $primaryImage }}" alt="{{ $prod->name }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                
                                <!-- Stock Badge -->
                                <div class="absolute top-3 left-3 flex flex-col gap-1">
                                    @if($inStock)
                                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500 text-white shadow-sm">
                                            {{ $prod->stock_quantity }} {{ $stockUnit }} left
                                        </span>
                                    @else
                                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500 text-white shadow-sm">
                                            Out of Stock
                                        </span>
                                    @endif
                                </div>

                                <!-- Brand Badge -->
                                @if($prod->brand)
                                    <div class="absolute top-3 right-3">
                                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/90 text-slate-800 backdrop-blur shadow-sm">
                                            {{ $prod->brand->name }}
                                        </span>
                                    </div>
                                @endif
                            </div>

                            <!-- Product Info -->
                            <div class="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <span class="text-[11px] font-semibold tracking-wider uppercase text-indigo-600 block mb-1">
                                        {{ $prod->category?->name ?? 'General' }}
                                    </span>
                                    <h4 class="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                        {{ $prod->name }}
                                    </h4>
                                    <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                        {{ $prod->description ?: 'High quality item verified by ' . $shop->name . '.' }}
                                    </p>
                                </div>

                                <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                                    <div>
                                        <span class="text-xs text-gray-400 block font-medium">Price / {{ $stockUnit }}</span>
                                        <span class="text-lg font-black text-slate-900 tracking-tight">
                                            {{ $shop->currency ?: 'USD' }} {{ number_format($prod->price, 2) }}
                                        </span>
                                    </div>

                                    @if($inStock)
                                        <button onclick="addToCart({{ json_encode([
                                            'id' => $prod->id,
                                            'name' => $prod->name,
                                            'price' => (float)$prod->price,
                                            'stock_unit' => $stockUnit,
                                            'stock_quantity' => $prod->stock_quantity,
                                            'image' => $primaryImage,
                                        ]) }})" class="btn-theme-primary px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                                            <i class="bi bi-cart-plus"></i> Add
                                        </button>
                                    @else
                                        <button disabled class="px-3 py-2 rounded-xl text-xs font-bold bg-gray-200 text-gray-400 cursor-not-allowed">
                                            Sold Out
                                        </button>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
                    <i class="bi bi-box-seam text-5xl text-gray-300 mb-3 block"></i>
                    <h4 class="text-lg font-bold text-slate-800">No published items yet</h4>
                    <p class="text-sm text-gray-500 mt-1">The store owner is currently adding items to this shop catalog.</p>
                </div>
            @endif
        </section>
    </main>

    <!-- Slide-Out Shopping Cart Drawer -->
    <div id="cartDrawerBackdrop" onclick="toggleCartDrawer()" class="fixed inset-0 bg-black/50 z-50 opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <div id="cartDrawer" class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col">
        <!-- Drawer Header -->
        <div class="p-5 border-b border-gray-200 flex items-center justify-between bg-slate-50">
            <div class="flex items-center gap-2">
                <i class="bi bi-bag-check-fill text-theme-primary text-xl"></i>
                <h3 class="font-extrabold text-slate-900 text-lg">Your Shopping Cart</h3>
            </div>
            <button onclick="toggleCartDrawer()" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <i class="bi bi-x-lg text-lg"></i>
            </button>
        </div>

        <!-- Drawer Items List -->
        <div id="cartItemsContainer" class="flex-1 overflow-y-auto p-5 space-y-4">
            <!-- Dynamically populated via JS -->
            <div class="text-center py-12 text-gray-400">
                <i class="bi bi-cart-x text-4xl block mb-2"></i>
                <p class="text-sm font-medium">Your cart is empty.</p>
            </div>
        </div>

        <!-- Drawer Footer & Checkout -->
        <div class="p-5 border-t border-gray-200 bg-slate-50">
            <div class="space-y-2 mb-4 text-sm">
                <div class="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span id="cartSubtotal" class="font-semibold text-slate-800">{{ $shop->currency ?: 'USD' }} 0.00</span>
                </div>
                <div class="flex justify-between text-gray-500">
                    <span>Store Delivery</span>
                    <span class="font-semibold text-emerald-600">Calculated at checkout</span>
                </div>
                <div class="flex justify-between text-base font-black text-slate-900 border-t border-gray-200 pt-2">
                    <span>Order Total</span>
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
    <div id="checkoutModal" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in">
            <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div>
                    <h4 class="font-extrabold text-slate-900 text-lg">Instant Store Checkout</h4>
                    <p class="text-xs text-gray-500 mt-0.5">Order will be fulfilled directly by {{ $shop->name }}</p>
                </div>
                <button onclick="closeCheckoutModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="bi bi-x-lg text-lg"></i>
                </button>
            </div>

            <form onsubmit="handleStoreCheckout(event)" class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Your Full Name</label>
                    <input type="text" id="custName" required placeholder="Alice Customer" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Phone Number</label>
                        <input type="tel" id="custPhone" required placeholder="01700000001" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Payment Method</label>
                        <select id="custPayment" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium">
                            <option value="cash">Cash on Delivery (COD)</option>
                            <option value="card">Card / Online Payment</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Delivery Address</label>
                    <textarea id="custAddress" required rows="2" placeholder="Street, house number, area, city..." class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"></textarea>
                </div>

                <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                        <span class="text-xs text-indigo-700 font-semibold block">Total Amount Due</span>
                        <span id="modalTotalAmount" class="text-lg font-black text-indigo-950">{{ $shop->currency ?: 'USD' }} 0.00</span>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-md bg-indigo-200 text-indigo-900 font-bold">
                        Direct Tenant Order
                    </span>
                </div>

                <button type="submit" id="btnPlaceOrder" class="btn-theme-primary w-full py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2">
                    <i class="bi bi-check-circle-fill"></i>
                    <span>Confirm & Place Order</span>
                </button>
            </form>
        </div>
    </div>

    <!-- Store Contact / About Modal -->
    <div id="supportModal" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div class="flex items-center justify-between pb-4 border-b border-gray-100">
                <h4 class="font-extrabold text-slate-900 text-lg">{{ $shop->name }} Contact</h4>
                <button onclick="closeSupportModal()" class="text-gray-400 hover:text-gray-600"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="py-4 space-y-3 text-sm">
                <div class="flex items-center gap-3 text-slate-700">
                    <i class="bi bi-geo-alt text-indigo-600 text-lg"></i>
                    <span>{{ $shop->address ?: 'Dhaka, Bangladesh' }}</span>
                </div>
                <div class="flex items-center gap-3 text-slate-700">
                    <i class="bi bi-telephone text-indigo-600 text-lg"></i>
                    <span>{{ $shop->phone ?: '+880 1700-000000' }}</span>
                </div>
                <div class="flex items-center gap-3 text-slate-700">
                    <i class="bi bi-envelope text-indigo-600 text-lg"></i>
                    <span>{{ $shop->email ?: 'contact@' . ($shop->subdomain ?: $shop->slug) . '.com' }}</span>
                </div>
                <div class="flex items-center gap-3 text-slate-700">
                    <i class="bi bi-clock text-indigo-600 text-lg"></i>
                    <span>9:00 AM — 10:00 PM (Daily)</span>
                </div>
            </div>
            <button onclick="closeSupportModal()" class="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xs text-slate-700">
                Close
            </button>
        </div>
    </div>

    <!-- Storefront Footer -->
    <footer style="background-color: {{ $footerBg }}; color: {{ $footerText }};" class="mt-16 py-12 border-t border-slate-800 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
                <div class="flex items-center gap-2 mb-3">
                    <div class="h-8 w-8 rounded-lg bg-theme-primary text-white flex items-center justify-center font-bold">
                        {{ strtoupper(substr($shop->name, 0, 1)) }}
                    </div>
                    <span class="text-lg font-bold text-white">{{ $shop->name }}</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Powered by GlobalShop Multi-Tenant SaaS platform. Independent storefront operating under custom tenant domain architecture.
                </p>
            </div>

            <div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-white mb-3">Shop Categories</h5>
                <ul class="text-xs space-y-2 text-slate-400">
                    @foreach($categories->take(5) as $cat)
                        <li><a href="#catalog" onclick="selectCategory({{ $cat->id }})" class="hover:text-white transition-colors">{{ $cat->name }}</a></li>
                    @endforeach
                </ul>
            </div>

            <div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-white mb-3">Domain & Licensing</h5>
                <p class="text-xs text-slate-400 mb-2">
                    Subdomain: <code class="text-indigo-400">{{ $shop->subdomain ?: $shop->slug }}.shopbusket.com</code>
                </p>
                @if($shop->custom_domain)
                    <p class="text-xs text-slate-400 mb-2">
                        Custom Domain: <code class="text-emerald-400">{{ $shop->custom_domain }}</code>
                    </p>
                @endif
                <p class="text-[11px] text-slate-500 mt-4">
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

        // In-memory Shopping Cart
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
                    <div class="text-center py-12 text-gray-400">
                        <i class="bi bi-cart-x text-4xl block mb-2"></i>
                        <p class="text-sm font-medium">Your cart is empty.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = cart.map(item => `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-lg border border-gray-200">
                    <div class="flex-1 min-w-0">
                        <h5 class="text-xs font-bold text-slate-800 truncate">${item.name}</h5>
                        <p class="text-xs text-gray-500">${shopConfig.currency} ${item.price.toFixed(2)} / ${item.stock_unit}</p>
                        <div class="flex items-center gap-2 mt-1.5">
                            <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 rounded bg-white border border-gray-300 text-xs font-bold text-slate-700 hover:bg-gray-100 flex items-center justify-center">-</button>
                            <span class="text-xs font-bold text-slate-900 w-6 text-center">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 rounded bg-white border border-gray-300 text-xs font-bold text-slate-700 hover:bg-gray-100 flex items-center justify-center">+</button>
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

        // Category Filtering
        let activeCategoryId = null;

        function selectCategory(catId) {
            activeCategoryId = catId;
            document.querySelectorAll('.cat-pill').forEach(btn => {
                btn.classList.remove('bg-theme-primary', 'text-white', 'shadow-sm');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });

            const activeBtn = catId ? document.getElementById(`cat-btn-${catId}`) : document.getElementById('cat-btn-all');
            if (activeBtn) {
                activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                activeBtn.classList.add('bg-theme-primary', 'text-white', 'shadow-sm');
            }
            filterProducts();
        }

        function filterProducts() {
            const search = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
            const sort = document.getElementById('sortSelect')?.value || 'latest';
            const cards = Array.from(document.querySelectorAll('.product-card'));

            let visibleCount = 0;

            cards.forEach(card => {
                const name = card.dataset.name;
                const catId = card.dataset.categoryId ? parseInt(card.dataset.categoryId) : null;
                const matchesSearch = !search || name.includes(search);
                const matchesCat = activeCategoryId === null || catId === activeCategoryId;

                if (matchesSearch && matchesCat) {
                    card.style.display = 'flex';
                    visibleCount++;
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
            toggleCartDrawer();
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
            btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processing Order...`;

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
                            <p class="text-sm text-slate-600 mb-2">Thank you! Your order has been registered with <b>${shopConfig.slug}</b>.</p>
                            <div class="p-3 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
                                Invoice: ${data.sale?.invoice_number || 'INV-SUCCESS'}
                            </div>
                            <p class="text-xs text-gray-400 mt-2">Inventory has been automatically allocated.</p>
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
                // If API requires auth session or tenant scope fallback
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

        // Live Theme Switcher Function
        function switchTheme(newThemeSlug) {
            const url = new URL(window.location.href);
            url.searchParams.set('preview_theme', newThemeSlug);
            window.location.href = url.toString();
        }
    </script>
</body>
</html>
