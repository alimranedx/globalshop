<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Easy Login - Developer Console</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css'])
    
    <style>
        :root {
            --bg-primary: #050508;
            --bg-surface: rgba(18, 18, 24, 0.7);
            --bg-card: rgba(26, 26, 36, 0.4);
            --border-glow: rgba(99, 102, 241, 0.15);
            --border-light: rgba(255, 255, 255, 0.06);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --color-accent: #6366f1;
            --color-accent-glow: rgba(99, 102, 241, 0.35);
            --color-success: #10b981;
            --color-danger: #ef4444;
            --color-warning: #f59e0b;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-primary);
            background-image: 
                radial-gradient(circle at 5% 10%, rgba(99, 102, 241, 0.08) 0%, transparent 35%),
                radial-gradient(circle at 95% 90%, rgba(16, 185, 129, 0.04) 0%, transparent 35%);
            color: var(--text-primary);
        }

        .glass-panel {
            background: var(--bg-surface);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-light);
        }

        .glass-card {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border-light);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
            border-color: rgba(99, 102, 241, 0.25);
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
        }

        /* View Mode Swapping */
        .mode-table .view-mode-card { display: none !important; }
        .mode-card .view-mode-table { display: none !important; }

        /* Rotate transition */
        .arrow-rotate {
            transition: transform 0.2s ease-in-out;
        }
    </style>
</head>
<body class="h-full bg-[#050508] text-[#f3f4f6] min-h-screen flex flex-col mode-table">

    <!-- Toast Notification (Laravel Session-based) -->
    @if(session('error'))
        <div id="session-toast" class="fixed bottom-6 right-6 z-50 flex items-center p-4 space-x-3 text-white bg-red-600 rounded-xl shadow-lg border border-red-500/30 max-w-md animate-slide-in duration-300">
            <span class="text-xl">⚠️</span>
            <div class="flex-1 text-sm font-medium">{{ session('error') }}</div>
            <button onclick="document.getElementById('session-toast').remove()" class="text-white/80 hover:text-white font-bold">&times;</button>
        </div>
    @endif

    <!-- Sticky Header -->
    <header class="sticky top-0 z-40 glass-panel border-b border-white/5 py-4 px-6">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-3">
                <span class="text-3xl">🏪</span>
                <div>
                    <h1 class="text-xl font-bold bg-gradient-to-r from-white to-[#818cf8] bg-clip-text text-transparent">
                        Shop Easy Login
                    </h1>
                    <p class="text-xs text-[#9ca3af]">Developer & QA Account Switcher Console</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Local Dev Environment Only
                </span>
                <span class="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    APP_ENV: {{ app()->environment() }}
                </span>
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        <!-- Search and Filters Form -->
        <section class="glass-panel rounded-2xl p-5 border border-white/5">
            <form action="{{ route('shop.easy-login') }}" method="GET" class="space-y-4" id="filters-form">
                <!-- Search bar & View switch -->
                <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="relative w-full md:flex-1">
                        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9ca3af]">🔍</span>
                        <input type="text" name="search" value="{{ $currentFilters['search'] ?? '' }}" 
                               placeholder="Search by shop name, owner name, user name, email, employee ID..." 
                               class="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-[#9ca3af]/60">
                    </div>
                    
                    <!-- View modes -->
                    <div class="flex bg-black/30 p-1 rounded-xl border border-white/5 self-stretch md:self-auto justify-center">
                        <button type="button" id="btn-view-table" onclick="setViewMode('table')" 
                                class="px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all">
                            📊 Table View
                        </button>
                        <button type="button" id="btn-view-card" onclick="setViewMode('card')" 
                                class="px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all">
                            📇 Card View
                        </button>
                    </div>
                </div>

                <!-- Dropdown filters -->
                <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5 pt-2">
                    <!-- Shop Filter -->
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Shop</label>
                        <select name="shop" onchange="this.form.submit()" 
                                class="w-full bg-[#121218] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-indigo-500">
                            <option value="">All Shops</option>
                            @foreach($filterShops as $fs)
                                <option value="{{ $fs->id }}" {{ ($currentFilters['shop'] ?? '') == $fs->id ? 'selected' : '' }}>
                                    {{ $fs->name }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Role Filter -->
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Role</label>
                        <select name="role" onchange="this.form.submit()" 
                                class="w-full bg-[#121218] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-indigo-500">
                            <option value="">All Roles</option>
                            @foreach($filterRoles as $fr)
                                <option value="{{ $fr }}" {{ ($currentFilters['role'] ?? '') == $fr ? 'selected' : '' }}>
                                    {{ $fr }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Subscription Plan Filter -->
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Plan</label>
                        <select name="subscription" onchange="this.form.submit()" 
                                class="w-full bg-[#121218] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-indigo-500">
                            <option value="">All Plans</option>
                            @foreach($filterPlans as $fp)
                                <option value="{{ $fp->id }}" {{ ($currentFilters['subscription'] ?? '') == $fp->id ? 'selected' : '' }}>
                                    {{ $fp->name }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Status Filter -->
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Status</label>
                        <select name="status" onchange="this.form.submit()" 
                                class="w-full bg-[#121218] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-indigo-500">
                            <option value="">All Statuses</option>
                            <option value="active_shop" {{ ($currentFilters['status'] ?? '') === 'active_shop' ? 'selected' : '' }}>Active Shop</option>
                            <option value="suspended_shop" {{ ($currentFilters['status'] ?? '') === 'suspended_shop' ? 'selected' : '' }}>Suspended Shop</option>
                            <option value="pending_shop" {{ ($currentFilters['status'] ?? '') === 'pending_shop' ? 'selected' : '' }}>Pending Approval Shop</option>
                            <option value="active_user" {{ ($currentFilters['status'] ?? '') === 'active_user' ? 'selected' : '' }}>Active User</option>
                            <option value="pending_user" {{ ($currentFilters['status'] ?? '') === 'pending_user' ? 'selected' : '' }}>Pending Approval User</option>
                        </select>
                    </div>

                    <!-- Email Verified Filter -->
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Email Verification</label>
                        <select name="email_verified" onchange="this.form.submit()" 
                                class="w-full bg-[#121218] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-indigo-500">
                            <option value="">All Verification</option>
                            <option value="verified" {{ ($currentFilters['email_verified'] ?? '') === 'verified' ? 'selected' : '' }}>Verified</option>
                            <option value="unverified" {{ ($currentFilters['email_verified'] ?? '') === 'unverified' ? 'selected' : '' }}>Unverified</option>
                        </select>
                    </div>
                </div>

                <!-- Sorting and control buttons -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                    <div class="flex items-center gap-4 text-xs text-[#9ca3af]">
                        <!-- Sort by -->
                        <div class="flex items-center gap-2">
                            <span>Sort By:</span>
                            <select name="sort_by" onchange="this.form.submit()" class="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-[#f3f4f6] focus:outline-none">
                                <option value="name" {{ ($currentFilters['sort_by'] ?? '') === 'name' ? 'selected' : '' }}>Name</option>
                                <option value="email" {{ ($currentFilters['sort_by'] ?? '') === 'email' ? 'selected' : '' }}>Email</option>
                                <option value="role" {{ ($currentFilters['sort_by'] ?? '') === 'role' ? 'selected' : '' }}>Role</option>
                                <option value="last_login" {{ ($currentFilters['sort_by'] ?? '') === 'last_login' ? 'selected' : '' }}>Last Login</option>
                                <option value="created_at" {{ ($currentFilters['sort_by'] ?? '') === 'created_at' ? 'selected' : '' }}>Created Date</option>
                            </select>
                        </div>
                        <!-- Sort dir -->
                        <div class="flex items-center gap-2">
                            <span>Order:</span>
                            <select name="sort_dir" onchange="this.form.submit()" class="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-[#f3f4f6] focus:outline-none">
                                <option value="asc" {{ ($currentFilters['sort_dir'] ?? '') === 'asc' ? 'selected' : '' }}>Ascending</option>
                                <option value="desc" {{ ($currentFilters['sort_dir'] ?? '') === 'desc' ? 'selected' : '' }}>Descending</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        @if(array_filter($currentFilters))
                            <a href="{{ route('shop.easy-login') }}" class="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors">
                                Reset Filters
                            </a>
                        @endif
                        <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-indigo-500/10">
                            Apply Search
                        </button>
                    </div>
                </div>
            </form>
        </section>

        <!-- Skeleton Loading Loader (hidden by default) -->
        <div id="loading-skeleton" class="hidden space-y-6">
            @for ($i = 0; $i < 2; $i++)
                <div class="glass-panel rounded-2xl border border-white/5 overflow-hidden animate-pulse">
                    <div class="h-24 bg-white/5 border-b border-white/5 px-6 flex items-center">
                        <div class="w-12 h-12 bg-white/10 rounded-xl"></div>
                        <div class="ml-4 space-y-2 flex-1">
                            <div class="h-4 bg-white/10 rounded w-1/4"></div>
                            <div class="h-3 bg-white/10 rounded w-1/3"></div>
                        </div>
                    </div>
                </div>
            @endfor
        </div>

        <!-- Main Shops / Users Listing -->
        <div id="main-content" class="space-y-6">
            @if($groupedUsers->isEmpty())
                <!-- Empty State -->
                <div class="glass-panel rounded-2xl border border-white/5 p-12 text-center max-w-xl mx-auto space-y-4">
                    <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-2xl">
                        🔍
                    </div>
                    <h3 class="text-lg font-bold text-white">No Shops or Accounts Found</h3>
                    <p class="text-sm text-[#9ca3af] max-w-md mx-auto">
                        We couldn't find any owners or employees matching your criteria. Try adjusting your filters or resetting the search text.
                    </p>
                    <a href="{{ route('shop.easy-login') }}" class="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-indigo-500/15">
                        Reset All Criteria
                    </a>
                </div>
            @else
                @foreach($groupedUsers as $shopId => $users)
                    @php
                        $shopDetail = $shopDetails[$shopId] ?? null;
                        $shop = $shopDetail['shop'] ?? null;
                    @endphp
                    @if($shop)
                        <!-- Shop Segment Card -->
                        <div class="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                            <!-- Shop Panel Header -->
                            <div class="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border-b border-white/5">
                                <div class="flex items-center gap-3.5">
                                    <!-- Dynamic Avatar -->
                                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-lg text-indigo-400">
                                        {{ mb_substr($shop->name, 0, 2) }}
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-2.5">
                                            <h2 class="text-lg font-bold text-white">{{ $shop->name }}</h2>
                                            <!-- Shop Status Badge -->
                                            @if($shop->status === 'active')
                                                <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Active</span>
                                            @elseif($shop->status === 'suspended')
                                                <span class="px-2 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">Suspended</span>
                                            @else
                                                <span class="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">{{ $shop->status }}</span>
                                            @endif
                                        </div>
                                        <div class="text-xs text-[#9ca3af] flex flex-wrap gap-x-3 items-center">
                                            <span>Slug: <code class="text-indigo-300 font-mono">{{ $shop->slug }}</code></span>
                                            <span class="text-white/10">•</span>
                                            <span>Plan: <span class="text-purple-400 font-semibold">{{ $shopDetail['plan_name'] }}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Header Actions & Stats -->
                                <div class="flex items-center gap-4">
                                    <div class="hidden lg:flex items-center gap-5 text-right text-xs">
                                        <div>
                                            <div class="text-[#9ca3af]">Total Employees</div>
                                            <div class="text-sm font-bold text-white">{{ $shopDetail['total_employees'] }}</div>
                                        </div>
                                        <div>
                                            <div class="text-[#9ca3af]">Owner</div>
                                            <div class="text-sm font-bold text-white">{{ $shopDetail['owner_name'] }}</div>
                                        </div>
                                    </div>

                                    <button type="button" onclick="toggleShop({{ $shop->id }})" 
                                            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 flex items-center justify-center transition-colors">
                                        <span id="shop-icon-{{ $shop->id }}" class="arrow-rotate text-sm rotate-90">▶</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Expandable Shop Employee List -->
                            <div id="shop-employees-{{ $shop->id }}" class="p-6 space-y-6">
                                <!-- Shop Summary Card (Metadata box) -->
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                                    <div>
                                        <span class="text-[#9ca3af]">Shop Owner:</span>
                                        <div class="font-semibold text-white mt-0.5">{{ $shopDetail['owner_name'] }}</div>
                                    </div>
                                    <div>
                                        <span class="text-[#9ca3af]">Total / Active / Pending:</span>
                                        <div class="font-semibold text-white mt-0.5">
                                            {{ $shopDetail['total_employees'] }} total ({{ $shopDetail['active_employees'] }} active, {{ $shopDetail['pending_employees'] }} pending)
                                        </div>
                                    </div>
                                    <div>
                                        <span class="text-[#9ca3af]">Created At:</span>
                                        <div class="font-semibold text-white mt-0.5">{{ $shop->created_at ? $shop->created_at->format('M d, Y') : 'N/A' }}</div>
                                    </div>
                                    <div>
                                        <span class="text-[#9ca3af]">Domain:</span>
                                        <div class="font-semibold text-indigo-400 mt-0.5 truncate">{{ $shop->domain ?? 'No custom domain' }}</div>
                                    </div>
                                </div>

                                <!-- Role groups -->
                                @php
                                    // Group current shop users by role
                                    $rolesGrouped = $users->groupBy('role_name');
                                    $roleOrder = ['Owner', 'Manager', 'Sales Manager', 'Editor', 'Worker'];
                                    
                                    // Get roles sorted by our custom order
                                    $sortedRoles = $rolesGrouped->keys()->sortBy(function($role) use ($roleOrder) {
                                        $idx = array_search($role, $roleOrder);
                                        return $idx === false ? 99 : $idx;
                                    });
                                @endphp

                                @foreach($sortedRoles as $roleName)
                                    @php
                                        $roleUsers = $rolesGrouped->get($roleName);
                                    @endphp
                                    <div class="space-y-3">
                                        <!-- Role Title Divider -->
                                        <div class="flex items-center gap-3">
                                            <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {{ Str::plural($roleName) }}
                                            </span>
                                            <div class="flex-1 h-[1px] bg-white/5"></div>
                                        </div>

                                        <!-- 1. Table View -->
                                        <div class="view-mode-table overflow-x-auto rounded-xl border border-white/5">
                                            <table class="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr class="bg-white/[0.02] text-[#9ca3af] border-b border-white/5 font-semibold">
                                                        <th class="p-3">User</th>
                                                        <th class="p-3">Employee ID</th>
                                                        <th class="p-3">Status</th>
                                                        <th class="p-3">Email Verified</th>
                                                        <th class="p-3">Last Login</th>
                                                        <th class="p-3">Created Date</th>
                                                        <th class="p-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    @foreach($roleUsers as $u)
                                                        @php
                                                            $isEligible = ($shop->status === 'active') && ($u->employee_status === 'active');
                                                        @endphp
                                                        <tr class="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                                            <td class="p-3 flex items-center gap-3">
                                                                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-bold text-xs text-indigo-300">
                                                                    {{ mb_substr($u->user_name, 0, 2) }}
                                                                </div>
                                                                <div>
                                                                    <div class="font-bold text-white">{{ $u->user_name }}</div>
                                                                    <div class="text-[10px] text-[#9ca3af]">{{ $u->user_email }}</div>
                                                                </div>
                                                            </td>
                                                            <td class="p-3 font-mono text-[#9ca3af]">
                                                                {{ $u->employee_id ? 'EMP-'.str_pad($u->employee_id, 4, '0', STR_PAD_LEFT) : 'OWN-'.str_pad($u->user_id, 4, '0', STR_PAD_LEFT) }}
                                                            </td>
                                                            <td class="p-3">
                                                                @if($u->employee_status === 'active')
                                                                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                                                                @else
                                                                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{{ $u->employee_status }}</span>
                                                                @endif
                                                            </td>
                                                            <td class="p-3">
                                                                @if($u->email_verified_at)
                                                                    <span class="text-emerald-400" title="Verified at {{ $u->email_verified_at }}">✅ Verified</span>
                                                                @else
                                                                    <span class="text-[#9ca3af]">❌ Unverified</span>
                                                                @endif
                                                            </td>
                                                            <td class="p-3 text-[#9ca3af]">
                                                                {{ $u->last_login ? \Carbon\Carbon::createFromTimestamp($u->last_login)->diffForHumans() : 'Never' }}
                                                            </td>
                                                            <td class="p-3 text-[#9ca3af]">
                                                                {{ \Carbon\Carbon::parse($u->user_created_at)->format('M d, Y') }}
                                                            </td>
                                                            <td class="p-3 text-right">
                                                                @if($isEligible)
                                                                    <button type="button" onclick="confirmLogin({{ $shop->id }}, '{{ $shop->name }}', {{ $u->user_id }}, '{{ $u->user_name }}', '{{ $roleName }}')" 
                                                                            class="px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-indigo-600/15">
                                                                        Login
                                                                    </button>
                                                                @else
                                                                    <button type="button" disabled 
                                                                            title="Cannot login: {{ $shop->status !== 'active' ? 'Shop is suspended/pending.' : 'User account is not active.' }}"
                                                                            class="px-4.5 py-1.5 bg-white/5 text-[#9ca3af] cursor-not-allowed border border-white/5 rounded-lg font-bold text-xs opacity-50">
                                                                        Login
                                                                    </button>
                                                                @endif
                                                            </td>
                                                        </tr>
                                                    @endforeach
                                                </tbody>
                                            </table>
                                        </div>

                                        <!-- 2. Card View -->
                                        <div class="view-mode-card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            @foreach($roleUsers as $u)
                                                @php
                                                    $isEligible = ($shop->status === 'active') && ($u->employee_status === 'active');
                                                @endphp
                                                <div class="glass-card rounded-xl p-4 flex flex-col justify-between gap-4">
                                                    <div class="flex gap-3">
                                                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-bold text-sm text-indigo-300">
                                                            {{ mb_substr($u->user_name, 0, 2) }}
                                                        </div>
                                                        <div class="flex-1 min-w-0">
                                                            <div class="font-bold text-white truncate text-sm">{{ $u->user_name }}</div>
                                                            <div class="text-xs text-[#9ca3af] truncate">{{ $u->user_email }}</div>
                                                            <div class="text-[10px] text-[#9ca3af]/80 mt-1 flex flex-wrap gap-x-2">
                                                                <span>ID: <code class="font-mono text-indigo-300">{{ $u->employee_id ? 'EMP-'.str_pad($u->employee_id, 4, '0', STR_PAD_LEFT) : 'OWN-'.str_pad($u->user_id, 4, '0', STR_PAD_LEFT) }}</code></span>
                                                                <span>•</span>
                                                                <span>Last: {{ $u->last_login ? \Carbon\Carbon::createFromTimestamp($u->last_login)->diffForHumans() : 'Never' }}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="flex items-center justify-between pt-3 border-t border-white/5 text-[11px]">
                                                        <div class="flex items-center gap-1.5">
                                                            @if($u->employee_status === 'active')
                                                                <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                                                            @else
                                                                <span class="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{{ $u->employee_status }}</span>
                                                            @endif

                                                            @if($u->email_verified_at)
                                                                <span class="text-emerald-400">Verified</span>
                                                            @else
                                                                <span class="text-[#9ca3af]">Unverified</span>
                                                            @endif
                                                        </div>

                                                        @if($isEligible)
                                                            <button type="button" onclick="confirmLogin({{ $shop->id }}, '{{ $shop->name }}', {{ $u->user_id }}, '{{ $u->user_name }}', '{{ $roleName }}')" 
                                                                    class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition-colors">
                                                                Login
                                                            </button>
                                                        @else
                                                            <button type="button" disabled 
                                                                    title="Cannot login: {{ $shop->status !== 'active' ? 'Shop is suspended/pending.' : 'User account is not active.' }}"
                                                                    class="px-4 py-1.5 bg-white/5 text-[#9ca3af] cursor-not-allowed border border-white/5 rounded-lg font-bold text-xs opacity-50">
                                                                Login
                                                            </button>
                                                        @endif
                                                    </div>
                                                </div>
                                            @endforeach
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif
                @endforeach

                <!-- Pagination footer -->
                <div class="pt-4">
                    {{ $paginatedUsers->links() }}
                </div>
            @endif
        </div>
    </main>

    <!-- Confirmation Modal Component -->
    <div id="confirm-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-in">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
                🔒 Confirm Switch Account
            </h3>
            <p class="text-xs text-[#9ca3af]" id="modal-warning-text"></p>
            <p class="text-xs text-[#9ca3af]">
                This will automatically terminate your previous session, clear current cookies, and initialize a new authenticated session for this user.
            </p>
            
            <form id="easy-login-form" action="{{ route('shop.easy-login.login') }}" method="POST">
                @csrf
                <input type="hidden" name="shop_id" id="login-shop-id">
                <input type="hidden" name="user_id" id="login-user-id">

                <div class="flex justify-end gap-3.5 pt-2">
                    <button type="button" onclick="closeConfirmModal()" 
                            class="px-4.5 py-2 text-xs font-semibold text-[#9ca3af] hover:text-white bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition-all">
                        Cancel
                    </button>
                    <button type="submit" onclick="showLoadingSkeleton()" 
                            class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/10">
                        Yes, Log In
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Sticky footer -->
    <footer class="glass-panel border-t border-white/5 py-4 text-center text-xs text-[#9ca3af]">
        <div class="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <span>© {{ date('Y') }} Global Shop Marketplace. Local development console.</span>
            <span class="text-indigo-400 font-medium">Laravel v{{ app()->version() }}</span>
        </div>
    </footer>

    <!-- Interactive JS scripts -->
    <script>
        // Load settings from local storage or default to table view
        let viewMode = localStorage.getItem('easy_login_view_mode') || 'table';
        document.body.className = `h-full bg-[#050508] text-[#f3f4f6] min-h-screen flex flex-col mode-${viewMode}`;
        updateViewModeButtons();

        // 1. View switching
        function setViewMode(mode) {
            viewMode = mode;
            localStorage.setItem('easy_login_view_mode', mode);
            document.body.className = `h-full bg-[#050508] text-[#f3f4f6] min-h-screen flex flex-col mode-${viewMode}`;
            updateViewModeButtons();
        }

        function updateViewModeButtons() {
            const btnTable = document.getElementById('btn-view-table');
            const btnCard = document.getElementById('btn-view-card');
            
            if (viewMode === 'table') {
                btnTable.className = "px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-indigo-600 text-white shadow-md";
                btnCard.className = "px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-[#9ca3af] hover:text-white";
            } else {
                btnTable.className = "px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-[#9ca3af] hover:text-white";
                btnCard.className = "px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-indigo-600 text-white shadow-md";
            }
        }

        // 2. Collapse / Expand Shops
        function toggleShop(shopId) {
            const content = document.getElementById(`shop-employees-${shopId}`);
            const icon = document.getElementById(`shop-icon-${shopId}`);
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.style.transform = 'rotate(90deg)';
                localStorage.setItem(`shop_collapsed_${shopId}`, 'expanded');
            } else if (content.style.display === 'block' || content.offsetParent !== null) {
                content.style.display = 'none';
                icon.style.transform = 'rotate(0deg)';
                localStorage.setItem(`shop_collapsed_${shopId}`, 'collapsed');
            }
        }

        // Restore collapse states on page load
        document.addEventListener('DOMContentLoaded', () => {
            @foreach($groupedUsers as $shopId => $users)
                const state{{ $shopId }} = localStorage.getItem(`shop_collapsed_{{ $shopId }}`);
                const content{{ $shopId }} = document.getElementById(`shop-employees-{{ $shopId }}`);
                const icon{{ $shopId }} = document.getElementById(`shop-icon-{{ $shopId }}`);
                if (content{{ $shopId }}) {
                    if (state{{ $shopId }} === 'collapsed') {
                        content{{ $shopId }}.style.display = 'none';
                        icon{{ $shopId }}.style.transform = 'rotate(0deg)';
                    } else {
                        content{{ $shopId }}.style.display = 'block';
                        icon{{ $shopId }}.style.transform = 'rotate(90deg)';
                    }
                }
            @endforeach
        });

        // 3. Login Switch Modal Control
        function confirmLogin(shopId, shopName, userId, userName, roleName) {
            document.getElementById('login-shop-id').value = shopId;
            document.getElementById('login-user-id').value = userId;
            
            const warningText = `Are you sure you want to switch your active session and log in as <strong class="text-white">${userName}</strong> with role <strong class="text-indigo-400">${roleName}</strong> at shop <strong class="text-white">${shopName}</strong>?`;
            document.getElementById('modal-warning-text').innerHTML = warningText;
            
            document.getElementById('confirm-modal').classList.remove('hidden');
        }

        function closeConfirmModal() {
            document.getElementById('confirm-modal').classList.add('hidden');
        }

        // 4. Loading skeleton trigger
        function showLoadingSkeleton() {
            closeConfirmModal();
            document.getElementById('main-content').classList.add('hidden');
            document.getElementById('loading-skeleton').classList.remove('hidden');
        }

        // Auto fadeout toasts
        setTimeout(() => {
            const toast = document.getElementById('session-toast');
            if (toast) {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    </script>
</body>
</html>
