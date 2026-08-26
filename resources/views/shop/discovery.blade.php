<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shop Directory & Discovery — GlobalShop</title>
    <meta name="description" content="Search and select your shop to access management dashboard.">
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
            background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
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
        }

        .btn-indigo:hover {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: #fff;
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
                <a href="{{ url('/') }}" class="text-secondary text-decoration-none small"><i
                        class="bi bi-house"></i> Home</a>
                <a href="{{ url('/marketplace') }}" class="text-secondary text-decoration-none small"><i
                        class="bi bi-bag"></i> Marketplace</a>
                <a href="#" class="text-secondary text-decoration-none small"><i class="bi bi-bag"></i> Register
                    New Shop</a>
            </div>
        </div>
    </nav>

    <!-- Search Header -->
    <header class="search-hero text-center">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-7">
                    <span
                        class="badge bg-indigo-subtle text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-semibold mb-3">
                        <i class="bi bi-buildings"></i> Shop Discovery Hub
                    </span>
                    <h1 class="fw-bold text-white mb-2 fs-2">Select or Search Your Shop</h1>
                    <p class="text-secondary mb-4">
                        Enter your shop name or unique shop slug to access your dedicated management portal.
                    </p>

                    <!-- Search Form -->
                    <form action="{{ url('/shop') }}" method="GET" class="d-flex gap-2">
                        <div class="input-group input-group-lg shadow-sm">
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
                <a href="{{ url('/shop') }}" class="btn btn-outline-secondary px-4">
                    <i class="bi bi-arrow-counterclockwise me-1"></i> Clear Search
                </a>
            </div>
        @endif
    </main>

    <!-- Footer -->
    <footer
        class="py-4 border-top border-secondary border-opacity-25 bg-dark bg-opacity-50 mt-auto text-center text-secondary">
        <div class="container">
            <p class="mb-0">© {{ date('Y') }} GlobalShop Platform. All rights reserved.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
