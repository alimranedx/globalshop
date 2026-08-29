<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shop Directory & Discovery — GlobalShop</title>
    <meta name="description" content="Search and select your shop to access management dashboard or register a new shop.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <!-- Google Fonts & Bootstrap 5 -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #0a0a0c;
            color: #f3f4f6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .search-hero {
            background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.18) 0%, transparent 70%);
            padding: 4rem 0 2rem 0;
        }

        .shop-card {
            background: rgba(24, 24, 32, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(16px);
            border-radius: 16px;
            transition: all 0.25s ease;
        }

        .shop-card:hover {
            transform: translateY(-4px);
            border-color: #6366f1;
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
        }

        .shop-avatar {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: #ffffff;
            font-weight: 700;
        }

        .btn-indigo {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #fff;
            border: none;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .btn-indigo:hover {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: #fff;
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .modal-glass {
            background: rgba(18, 18, 26, 0.96) !important;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(99, 102, 241, 0.25);
            border-radius: 20px;
            color: #f3f4f6;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }

        .form-control-dark {
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #ffffff;
            border-radius: 10px;
            padding: 0.7rem 1rem;
        }

        .form-select-dark, select.form-select {
            background-color: #1e1e2a !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #f3f4f6 !important;
            border-radius: 10px;
            padding: 0.7rem 2.2rem 0.7rem 1rem;
            cursor: pointer;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23a5b4fc' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e") !important;
            background-position: right 0.9rem center;
            background-size: 14px 12px;
        }

        .form-select-dark option, select option {
            background-color: #1a1a26 !important;
            color: #f3f4f6 !important;
            padding: 8px 12px;
        }

        .form-control-dark:focus, .form-select-dark:focus {
            background-color: #242434 !important;
            border-color: #6366f1 !important;
            color: #ffffff !important;
            box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25);
            outline: none;
        }

        .form-control-dark::placeholder {
            color: #6b7280;
        }

        .slug-preview-badge {
            background: rgba(99, 102, 241, 0.1);
            border: 1px dashed rgba(99, 102, 241, 0.3);
            border-radius: 8px;
            padding: 0.4rem 0.75rem;
            font-family: monospace;
            font-size: 0.85rem;
        }

        .pending-hero-badge {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1));
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #fbbf24;
        }
    </style>
</head>

<body>
    <!-- Navbar -->
    <nav
        class="navbar navbar-expand-lg navbar-dark bg-dark bg-opacity-75 border-bottom border-secondary border-opacity-25 sticky-top">
        <div class="container">
            <a class="navbar-brand fw-bold fs-4 text-white d-flex align-items-center gap-2" href="{{ url('/') }}">
                <i class="bi bi-shop text-primary"></i> GlobalShop
            </a>
            <div class="ms-auto d-flex align-items-center gap-3">
                <a href="{{ url('/') }}" class="text-secondary text-decoration-none small d-none d-sm-inline">
                    <i class="bi bi-house"></i> Home
                </a>
                <a href="{{ url('/marketplace') }}" class="text-secondary text-decoration-none small d-none d-sm-inline">
                    <i class="bi bi-bag"></i> Marketplace
                </a>
                <button type="button" class="btn btn-indigo btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-2 shadow-sm"
                    data-bs-toggle="modal" data-bs-target="#registerShopModal" id="btn-navbar-register-shop">
                    <i class="bi bi-plus-circle-fill"></i> Register New Shop
                </button>
            </div>
        </div>
    </nav>

    <!-- Search Header -->
    <header class="search-hero text-center">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="d-flex justify-content-center gap-2 mb-3">
                        <span class="badge bg-indigo-subtle text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-semibold">
                            <i class="bi bi-buildings"></i> Shop Discovery Hub
                        </span>
                        <span class="badge pending-hero-badge px-3 py-2 rounded-pill fw-semibold">
                            <i class="bi bi-shield-check"></i> Admin Approved Marketplace
                        </span>
                    </div>

                    <h1 class="fw-bold text-white mb-2 fs-2">Find Your Shop or Open a New Store</h1>
                    <p class="text-secondary mb-4">
                        Search active merchant portals below, or register your shop to join our multi-tenant SaaS marketplace.
                    </p>

                    <!-- Search Form & Register CTA -->
                    <form action="{{ url('/shop') }}" method="GET" class="d-flex flex-column flex-sm-row gap-2 justify-content-center mb-3">
                        <div class="input-group input-group-lg shadow-sm" style="max-width: 580px;">
                            <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary">
                                <i class="bi bi-search"></i>
                            </span>
                            <input type="text" name="search"
                                class="form-control bg-dark text-white border-secondary border-opacity-50"
                                placeholder="Search by shop name (e.g. Alpha) or slug (e.g. alpha)..."
                                value="{{ $search }}" autocomplete="off" autofocus>
                            @if ($search)
                                <a href="{{ url('/shop') }}"
                                    class="btn btn-outline-secondary d-flex align-items-center">
                                    <i class="bi bi-x-lg"></i>
                                </a>
                            @endif
                            <button class="btn btn-indigo px-4" type="submit">Search</button>
                        </div>
                    </form>

                    <div class="d-flex align-items-center justify-content-center gap-2 mt-3 text-secondary small">
                        <span>Are you a new shop owner?</span>
                        <a href="javascript:void(0)" class="text-primary fw-bold text-decoration-none" data-bs-toggle="modal" data-bs-target="#registerShopModal">
                            <i class="bi bi-rocket-takeoff"></i> Register New Shop (Pending Admin Review)
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Shop Listing Section -->
    <main class="container py-4 flex-grow-1">
        @if ($search)
            <div class="mb-4 text-secondary">
                Showing results for "<strong class="text-white">{{ $search }}</strong>" ({{ $shops->total() }}
                found):
            </div>
        @endif

        @if ($shops->count() > 0)
            <div class="row g-4">
                @foreach ($shops as $shop)
                    <div class="col-md-6 col-lg-4">
                        <div class="card shop-card h-100 p-3 text-white">
                            <div class="card-body d-flex flex-column">
                                <div class="d-flex align-items-center gap-3 mb-3">
                                    <div class="shop-avatar">
                                        {{ strtoupper(substr($shop->name, 0, 1)) }}
                                    </div>
                                    <div>
                                        <h5 class="card-title fw-bold mb-0 text-white">{{ $shop->name }}</h5>
                                        <div class="d-flex align-items-center gap-2 mt-1">
                                            <span class="badge bg-secondary bg-opacity-50 font-monospace text-light">
                                                /shop/{{ $shop->slug }}
                                            </span>
                                            <span
                                                class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                                                {{ ucfirst($shop->status) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p class="text-secondary small mb-4">
                                    Click below to enter the shop-specific portal for
                                    <strong>{{ $shop->name }}</strong>.
                                </p>

                                <a href="{{ url('/shop/' . $shop->slug) }}" class="btn btn-indigo w-100 mt-auto py-2">
                                    <i class="bi bi-box-arrow-in-right me-1"></i> Access Shop
                                </a>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Pagination -->
            <div class="d-flex justify-content-center mt-5">
                {{ $shops->links('pagination::bootstrap-5') }}
            </div>
        @else
            <div class="text-center py-5">
                <div class="fs-1 text-secondary mb-3"><i class="bi bi-shop-window"></i></div>
                <h4 class="fw-bold text-white mb-2">No Shops Found</h4>
                <p class="text-secondary mb-4">
                    @if ($search)
                        No shop matching "<strong>{{ $search }}</strong>" was found. Try checking the spelling or
                        searching for a different shop slug.
                    @else
                        There are currently no active shops available in the directory.
                    @endif
                </p>
                <div class="d-flex justify-content-center gap-2">
                    @if ($search)
                        <a href="{{ url('/shop') }}" class="btn btn-outline-secondary px-4">
                            <i class="bi bi-arrow-counterclockwise me-1"></i> Clear Search
                        </a>
                    @endif
                    <button class="btn btn-indigo px-4" data-bs-toggle="modal" data-bs-target="#registerShopModal">
                        <i class="bi bi-plus-circle me-1"></i> Register Your Shop
                    </button>
                </div>
            </div>
        @endif
    </main>

    <!-- Modal: Register New Shop -->
    <div class="modal fade" id="registerShopModal" tabindex="-1" aria-labelledby="registerShopModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content modal-glass p-2">
                <!-- Registration Form View -->
                <div id="modal-form-container">
                    <div class="modal-header border-0 pb-0">
                        <div class="d-flex align-items-center gap-3">
                            <div class="shop-avatar" style="width: 48px; height: 48px; font-size: 1.25rem;">
                                <i class="bi bi-shop"></i>
                            </div>
                            <div>
                                <h4 class="modal-title fw-bold text-white mb-0" id="registerShopModalLabel">Register New Shop</h4>
                                <div class="text-secondary small">Your shop will be created in <strong class="text-warning">Pending</strong> status awaiting Platform Admin review.</div>
                            </div>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <form id="shop-registration-form" onsubmit="handleShopRegistration(event)" class="modal-body py-4">
                        <!-- Error Alert Container -->
                        <div id="reg-error-alert" class="alert alert-danger d-none py-2 px-3 small border-0" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5;">
                            <i class="bi bi-exclamation-triangle-fill me-1"></i>
                            <span id="reg-error-message"></span>
                        </div>

                        <!-- Step 1: Shop Identity -->
                        <div class="mb-4">
                            <h6 class="text-primary fw-bold text-uppercase small mb-3 letter-spacing-1">
                                <i class="bi bi-building me-1"></i> 1. Store Information
                            </h6>
                            <div class="row g-3">
                                <div class="col-md-7">
                                    <label class="form-label text-secondary small fw-semibold">Shop Name <span class="text-danger">*</span></label>
                                    <input type="text" id="reg-shop-name" class="form-control form-control-dark" placeholder="e.g. Apex Lifestyle" required autocomplete="off">
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label text-secondary small fw-semibold">Currency</label>
                                    <select id="reg-currency" class="form-select form-select-dark">
                                        <option value="USD">USD ($)</option>
                                        <option value="BDT">BDT (৳)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="CAD">CAD ($)</option>
                                        <option value="AUD">AUD ($)</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label text-secondary small fw-semibold">Shop Subdomain Slug <span class="text-danger">*</span></label>
                                    <input type="text" id="reg-shop-slug" class="form-control form-control-dark font-monospace" placeholder="apex-lifestyle" required autocomplete="off">
                                    <div class="mt-2 slug-preview-badge text-secondary">
                                        <span>Portal URL preview: </span>
                                        <span class="text-primary fw-semibold">{{ url('/shop') }}/<span id="slug-live-preview">apex-lifestyle</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr class="border-secondary border-opacity-25 my-4">

                        <!-- Step 2: Owner Credentials -->
                        <div class="mb-3">
                            <h6 class="text-primary fw-bold text-uppercase small mb-3 letter-spacing-1">
                                <i class="bi bi-person-badge me-1"></i> 2. Shop Owner Account
                            </h6>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-semibold">Owner Full Name <span class="text-danger">*</span></label>
                                    <input type="text" id="reg-owner-name" class="form-control form-control-dark" placeholder="John Doe" required autocomplete="name">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-semibold">Owner Email Address <span class="text-danger">*</span></label>
                                    <input type="email" id="reg-owner-email" class="form-control form-control-dark" placeholder="john@example.com" required autocomplete="email">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-semibold">Password <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        <input type="password" id="reg-password" class="form-control form-control-dark" placeholder="••••••••" required minlength="6" autocomplete="new-password">
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('reg-password', this)">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </div>
                                    <div class="form-text text-secondary" style="font-size: 0.75rem;">Minimum 6 characters</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-semibold">Confirm Password <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        <input type="password" id="reg-password-confirm" class="form-control form-control-dark" placeholder="••••••••" required minlength="6" autocomplete="new-password">
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('reg-password-confirm', this)">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-semibold">Contact Phone (Optional)</label>
                                    <input type="tel" id="reg-phone" class="form-control form-control-dark" placeholder="+1 234 567 890">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-semibold">City & Country (Optional)</label>
                                    <input type="text" id="reg-city-country" class="form-control form-control-dark" placeholder="New York, USA">
                                </div>
                            </div>
                        </div>

                        <!-- Workflow Guidance Alert -->
                        <div class="p-3 rounded-3 mt-4" style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2);">
                            <div class="d-flex align-items-start gap-2">
                                <i class="bi bi-info-circle text-primary fs-5 mt-n1"></i>
                                <div class="small text-secondary">
                                    <strong class="text-white">Review Process:</strong> Once submitted, your shop will be placed in <strong class="text-warning">Pending Approval</strong> status. Our platform administrators will review your store application. After approval, you will be able to log into your dashboard, set up products, and invite your team members.
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer border-0 px-0 pb-0 mt-4 d-flex justify-content-between">
                            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" id="btn-submit-registration" class="btn btn-indigo px-5 py-2 fw-bold d-flex align-items-center gap-2">
                                <span>Submit Shop Application</span>
                                <i class="bi bi-arrow-right"></i>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Success / Pending Confirmation View -->
                <div id="modal-success-container" class="d-none text-center py-4 px-3">
                    <div class="mb-4">
                        <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle"
                            style="width: 80px; height: 80px; background: rgba(245, 158, 11, 0.15); border: 2px solid #f59e0b; color: #fbbf24; font-size: 2.5rem;">
                            <i class="bi bi-hourglass-split"></i>
                        </div>
                    </div>

                    <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold mb-3 fs-6">
                        ⏳ Application Status: Pending Platform Approval
                    </span>

                    <h3 class="fw-bold text-white mb-2">Shop Application Received!</h3>
                    <p class="text-secondary mx-auto mb-4" style="max-width: 540px;">
                        Congratulations! Your shop <strong class="text-white" id="success-shop-name">Your Shop</strong> has been registered and is now pending Platform Admin verification.
                    </p>

                    <!-- Summary Card -->
                    <div class="text-start mx-auto p-3 rounded-3 mb-4" style="max-width: 500px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div class="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25 small">
                            <span class="text-secondary">Shop Name:</span>
                            <strong class="text-white" id="success-summary-name">—</strong>
                        </div>
                        <div class="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25 small">
                            <span class="text-secondary">Dedicated Slug:</span>
                            <code class="text-primary" id="success-summary-slug">—</code>
                        </div>
                        <div class="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25 small">
                            <span class="text-secondary">Owner Account:</span>
                            <span class="text-white" id="success-summary-email">—</span>
                        </div>
                        <div class="d-flex justify-content-between py-2 small">
                            <span class="text-secondary">Next Step:</span>
                            <span class="text-warning fw-semibold">Admin Approval → Login & Invite Staff</span>
                        </div>
                    </div>

                    <div class="d-flex justify-content-center gap-3">
                        <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">
                            Back to Directory
                        </button>
                        <button type="button" class="btn btn-indigo px-4" onclick="resetAndCloseRegistrationModal()">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer
        class="py-4 border-top border-secondary border-opacity-25 bg-dark bg-opacity-50 mt-auto text-center text-secondary">
        <div class="container">
            <p class="mb-0">© {{ date('Y') }} GlobalShop Platform. Multi-Tenant SaaS Marketplace.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Automatic Slug Generator
        const shopNameInput = document.getElementById('reg-shop-name');
        const shopSlugInput = document.getElementById('reg-shop-slug');
        const livePreview = document.getElementById('slug-live-preview');

        function generateSlug(text) {
            return text
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-');
        }

        let userCustomizedSlug = false;

        shopNameInput?.addEventListener('input', function () {
            if (!userCustomizedSlug) {
                const slug = generateSlug(this.value);
                shopSlugInput.value = slug;
                livePreview.textContent = slug || 'your-shop';
            }
        });

        shopSlugInput?.addEventListener('input', function () {
            userCustomizedSlug = true;
            this.value = generateSlug(this.value);
            livePreview.textContent = this.value || 'your-shop';
        });

        function togglePasswordVisibility(inputId, btn) {
            const input = document.getElementById(inputId);
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            }
        }

        // Open modal automatically if #register or ?register=1
        document.addEventListener('DOMContentLoaded', function () {
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(window.location.search);
            if (hash === '#register' || hash === '#register-shop' || urlParams.has('register')) {
                const modal = new bootstrap.Modal(document.getElementById('registerShopModal'));
                modal.show();
            }
        });

        // AJAX Shop Registration Submission
        async function handleShopRegistration(e) {
            e.preventDefault();

            const errAlert = document.getElementById('reg-error-alert');
            const errMsg = document.getElementById('reg-error-message');
            const submitBtn = document.getElementById('btn-submit-registration');

            errAlert.classList.add('d-none');
            errMsg.textContent = '';

            const password = document.getElementById('reg-password').value;
            const passwordConfirm = document.getElementById('reg-password-confirm').value;

            if (password !== passwordConfirm) {
                errMsg.textContent = 'Passwords do not match. Please verify your password confirmation.';
                errAlert.classList.remove('d-none');
                return;
            }

            const cityCountry = document.getElementById('reg-city-country').value.trim();
            let city = null;
            let country = null;
            if (cityCountry) {
                const parts = cityCountry.split(',');
                city = parts[0]?.trim();
                country = parts[1]?.trim() || city;
            }

            const payload = {
                shop_name: document.getElementById('reg-shop-name').value.trim(),
                shop_slug: document.getElementById('reg-shop-slug').value.trim(),
                currency: document.getElementById('reg-currency').value,
                owner_name: document.getElementById('reg-owner-name').value.trim(),
                email: document.getElementById('reg-owner-email').value.trim(),
                password: password,
                phone: document.getElementById('reg-phone').value.trim() || null,
                city: city,
                country: country,
            };

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Registering Shop...';

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const res = await fetch('{{ url("/api/v1/auth/register-owner") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || ''
                    },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    // Populate success state
                    document.getElementById('success-shop-name').textContent = data.shop?.name || payload.shop_name;
                    document.getElementById('success-summary-name').textContent = data.shop?.name || payload.shop_name;
                    document.getElementById('success-summary-slug').textContent = '/shop/' + (data.shop?.slug || payload.shop_slug);
                    document.getElementById('success-summary-email').textContent = payload.email;

                    // Switch view in modal
                    document.getElementById('modal-form-container').classList.add('d-none');
                    document.getElementById('modal-success-container').classList.remove('d-none');
                } else {
                    const message = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Registration failed. Please check the inputs.');
                    errMsg.textContent = message;
                    errAlert.classList.remove('d-none');
                }
            } catch (error) {
                errMsg.textContent = 'An unexpected network error occurred. Please try again.';
                errAlert.classList.remove('d-none');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Submit Shop Application</span> <i class="bi bi-arrow-right"></i>';
            }
        }

        function resetAndCloseRegistrationModal() {
            const modalEl = document.getElementById('registerShopModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            setTimeout(() => {
                document.getElementById('shop-registration-form').reset();
                document.getElementById('modal-form-container').classList.remove('d-none');
                document.getElementById('modal-success-container').classList.add('d-none');
                userCustomizedSlug = false;
                livePreview.textContent = 'your-shop';
            }, 400);
        }
    </script>
</body>

</html>
