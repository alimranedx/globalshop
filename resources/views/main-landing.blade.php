<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlobalShop — Multi-Tenant E-Commerce Platform</title>
    <meta name="description" content="Centralized multi-tenant e-commerce platform for shop owners, staff, and customers.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <!-- Google Fonts & Bootstrap 5 -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
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
        .hero-section {
            background: radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%);
            padding: 5rem 0 3rem 0;
        }
        .feature-card {
            background: rgba(20, 20, 28, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(16px);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            border-color: rgba(99, 102, 241, 0.5);
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.2);
        }
        .btn-indigo {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #fff;
            border: none;
            font-weight: 600;
        }
        .btn-indigo:hover {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: #fff;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg sticky-top navbar-dark bg-dark bg-opacity-75 border-bottom border-secondary border-opacity-25 backdrop-blur">
        <div class="container">
            <a class="navbar-brand fw-bold fs-4 text-white d-flex align-items-center gap-2" href="{{ url('/') }}">
                <i class="bi bi-shop text-primary"></i> GlobalShop
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto gap-2">
                    <li class="nav-item">
                        <a class="nav-link active fw-medium" href="{{ url('/') }}">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link fw-medium" href="{{ url('/shop') }}"><i class="bi bi-search"></i> Shop Directory</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link fw-medium text-warning" href="{{ url('/admin') }}"><i class="bi bi-shield-lock"></i> Platform Admin</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="hero-section text-center">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <span class="badge bg-primary bg-opacity-25 text-primary px-3 py-2 rounded-pill fw-semibold mb-3">
                        <i class="bi bi-lightning-charge-fill"></i> Enterprise Multi-Tenant E-Commerce
                    </span>
                    <h1 class="display-4 fw-extrabold text-white mb-3">
                        Empowering Multi-Shop Systems &amp; Seamless Commerce
                    </h1>
                    <p class="lead text-secondary mb-4">
                        Discover shops, manage store operations, track sales, and power customer experiences across isolated tenant architecture.
                    </p>
                    <div class="d-flex justify-content-center gap-3">
                        <a href="{{ url('/shop') }}" class="btn btn-indigo btn-lg px-4 py-2 rounded-3">
                            <i class="bi bi-building-check me-2"></i> Shop Directory &amp; Discovery
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Feature Grid -->
    <section class="py-5 flex-grow-1">
        <div class="container">
            <div class="row g-4">
                <!-- Shop Management -->
                <div class="col-md-4">
                    <div class="card feature-card h-100 p-4 text-white">
                        <div class="card-body d-flex flex-column">
                            <div class="fs-1 text-primary mb-3">
                                <i class="bi bi-shop-window"></i>
                            </div>
                            <h4 class="card-title fw-bold text-white mb-2">Shop Management Entry</h4>
                            <p class="card-text text-secondary mb-4">
                                Search for shops by name or unique URL slug. Access tenant-isolated owner & employee management consoles.
                            </p>
                            <a href="{{ url('/shop') }}" class="btn btn-indigo mt-auto">
                                Search & Select Shop <i class="bi bi-arrow-right ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Customer Marketplace -->
                <div class="col-md-4">
                    <div class="card feature-card h-100 p-4 text-white">
                        <div class="card-body d-flex flex-column">
                            <div class="fs-1 text-success mb-3">
                                <i class="bi bi-cart3"></i>
                            </div>
                            <h4 class="card-title fw-bold text-white mb-2">Customer Marketplace</h4>
                            <p class="card-text text-secondary mb-4">
                                Unified customer portal. Browse catalog items across all active shops, execute orders, and track purchases.
                            </p>
                            <a href="{{ url('/shop') }}" class="btn btn-outline-success mt-auto">
                                Explore Shops <i class="bi bi-arrow-right ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Platform Administration -->
                <div class="col-md-4">
                    <div class="card feature-card h-100 p-4 text-white">
                        <div class="card-body d-flex flex-column">
                            <div class="fs-1 text-warning mb-3">
                                <i class="bi bi-cpu"></i>
                            </div>
                            <h4 class="card-title fw-bold text-white mb-2">Platform Administration</h4>
                            <p class="card-text text-secondary mb-4">
                                Super Administrator dashboard. Provision tenant subscriptions, inspect system audit logs, and control shop access.
                            </p>
                            <a href="{{ url('/admin') }}" class="btn btn-outline-warning mt-auto">
                                Admin Dashboard <i class="bi bi-arrow-right ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-4 border-top border-secondary border-opacity-25 bg-dark bg-opacity-50 mt-auto text-center text-secondary">
        <div class="container">
            <p class="mb-0">© {{ date('Y') }} GlobalShop Platform. All rights reserved.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
