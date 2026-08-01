<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access {{ $shop->name }} — GlobalShop</title>
    <meta name="description" content="Shop authentication and portal entry for {{ $shop->name }}.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <!-- Google Fonts & Bootstrap 5 -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #0a0a0c;
            background-image: radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%);
            color: #f3f4f6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .auth-card {
            background: rgba(20, 20, 28, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
        }
        .shop-badge-header {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 12px;
            padding: 1rem 1.25rem;
        }
        .nav-tabs .nav-link {
            color: #9ca3af;
            font-weight: 600;
            border: none;
            border-bottom: 2px solid transparent;
        }
        .nav-tabs .nav-link.active {
            color: #6366f1;
            background: transparent;
            border-bottom: 2px solid #6366f1;
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
    <!-- Top Nav -->
    <nav class="navbar navbar-dark bg-dark bg-opacity-75 border-bottom border-secondary border-opacity-25">
        <div class="container">
            <a class="navbar-brand fw-bold text-white d-flex align-items-center gap-2" href="{{ url('/') }}">
                <i class="bi bi-shop text-primary"></i> GlobalShop
            </a>
            <a href="{{ url('/shop') }}" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left me-1"></i> Shop Directory
            </a>
        </div>
    </nav>

    <!-- Main Container -->
    <div class="container py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div class="row w-100 justify-content-center">
            <div class="col-md-8 col-lg-5">
                
                <!-- Shop Header Badge -->
                <div class="shop-badge-header mb-4 text-center">
                    <div class="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 p-3 mb-2" style="width: 48px; height: 48px; font-weight: 700; font-size: 1.25rem;">
                        {{ strtoupper(substr($shop->name, 0, 1)) }}
                    </div>
                    <h3 class="fw-bold text-white mb-0">{{ $shop->name }}</h3>
                    <div class="d-flex justify-content-center align-items-center gap-2 mt-1">
                        <span class="badge bg-secondary bg-opacity-50 text-light font-monospace">
                            URL: /shop/{{ $shop->slug }}
                        </span>
                        <span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                            {{ ucfirst($shop->status) }}
                        </span>
                    </div>
                </div>

                <!-- If already logged in and authorized -->
                @if($authenticatedUser && $isAuthorized)
                    <div class="auth-card p-4 text-center">
                        <div class="fs-1 text-success mb-2"><i class="bi bi-check-circle-fill"></i></div>
                        <h4 class="fw-bold text-white mb-2">Welcome Back, {{ $authenticatedUser->name }}!</h4>
                        <p class="text-secondary small mb-4">
                            You are currently logged in and authorized to manage <strong>{{ $shop->name }}</strong>.
                        </p>
                        <a href="{{ url('/shop/' . $shop->slug . '/dashboard') }}" class="btn btn-indigo btn-lg w-100 mb-2 py-2 fs-6">
                            <i class="bi bi-speedometer2 me-2"></i> Go to Shop Dashboard
                        </a>
                        <form action="{{ route('logout') }}" method="POST" class="mt-2">
                            @csrf
                            <button type="submit" class="btn btn-sm btn-link text-danger text-decoration-none">
                                Log in with a different account
                            </button>
                        </form>
                    </div>
                @elseif($authenticatedUser && !$isAuthorized)
                    <!-- Logged in as user from another shop -->
                    <div class="auth-card p-4 text-center">
                        <div class="fs-1 text-warning mb-2"><i class="bi bi-exclamation-triangle-fill"></i></div>
                        <h4 class="fw-bold text-white mb-2">Access Restricted</h4>
                        <p class="text-secondary small mb-4">
                            You are logged in as <strong>{{ $authenticatedUser->name }}</strong> ({{ $authenticatedUser->email }}), but you are not authorized to manage <strong>{{ $shop->name }}</strong>.
                        </p>
                        <div class="d-flex flex-column gap-2">
                            <a href="{{ url('/shop') }}" class="btn btn-outline-secondary w-100">
                                <i class="bi bi-building me-1"></i> Return to Shop Directory
                            </a>
                            <form action="{{ route('logout') }}" method="POST">
                                @csrf
                                <button type="submit" class="btn btn-danger w-100">
                                    <i class="bi bi-box-arrow-right me-1"></i> Log Out & Switch Account
                                </button>
                            </form>
                        </div>
                    </div>
                @else
                    <!-- Auth Forms Card -->
                    <div class="auth-card p-4">

                        <!-- Flash / Error alerts -->
                        @if($errors->any())
                            <div class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                                <i class="bi bi-exclamation-circle-fill me-2"></i> {{ $errors->first() }}
                                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        @endif

                        @if(session('success'))
                            <div class="alert alert-success alert-dismissible fade show mb-3" role="alert">
                                <i class="bi bi-check-circle-fill me-2"></i> {{ session('success') }}
                                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        @endif

                        <!-- Auth Tabs -->
                        <ul class="nav nav-tabs mb-4 border-secondary border-opacity-25" id="authTabs" role="tablist">
                            <li class="nav-item flex-fill text-center" role="presentation">
                                <button class="nav-link w-100 active" id="login-tab" data-bs-toggle="tab" data-bs-target="#login-panel" type="button" role="tab">
                                    <i class="bi bi-box-arrow-in-right me-1"></i> Log In
                                </button>
                            </li>
                            <li class="nav-item flex-fill text-center" role="presentation">
                                <button class="nav-link w-100" id="register-tab" data-bs-toggle="tab" data-bs-target="#register-panel" type="button" role="tab">
                                    <i class="bi bi-person-plus me-1"></i> Register
                                </button>
                            </li>
                        </ul>

                        <div class="tab-content" id="authTabsContent">
                            <!-- LOGIN PANEL -->
                            <div class="tab-pane fade show active" id="login-panel" role="tabpanel">
                                <form action="{{ url('/shop/' . $shop->slug . '/login') }}" method="POST">
                                    @csrf
                                    <div class="mb-3">
                                        <label for="email" class="form-label text-secondary small fw-semibold">Email Address</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary">
                                                <i class="bi bi-envelope"></i>
                                            </span>
                                            <input type="email" name="email" id="email" class="form-control bg-dark text-white border-secondary border-opacity-50" placeholder="user@{{ $shop->slug }}.com" value="{{ old('email') }}" required autofocus>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                            <label for="password" class="form-label text-secondary small fw-semibold mb-0">Password</label>
                                            <a href="#" class="text-indigo text-decoration-none small" style="color: #6366f1;" data-bs-toggle="modal" data-bs-target="#forgotPasswordModal">Forgot Password?</a>
                                        </div>
                                        <div class="input-group">
                                            <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary">
                                                <i class="bi bi-lock"></i>
                                            </span>
                                            <input type="password" name="password" id="password" class="form-control bg-dark text-white border-secondary border-opacity-50" placeholder="••••••••" required>
                                        </div>
                                    </div>

                                    <button type="submit" class="btn btn-indigo w-100 py-2 fs-6 mt-3">
                                        <i class="bi bi-box-arrow-in-right me-1"></i> Log In to {{ $shop->name }}
                                    </button>
                                </form>
                            </div>

                            <!-- REGISTER PANEL -->
                            <div class="tab-pane fade" id="register-panel" role="tabpanel">
                                <form action="{{ url('/shop/' . $shop->slug . '/register') }}" method="POST">
                                    @csrf
                                    <div class="mb-3">
                                        <label for="reg_name" class="form-label text-secondary small fw-semibold">Full Name</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary">
                                                <i class="bi bi-person"></i>
                                            </span>
                                            <input type="text" name="name" id="reg_name" class="form-control bg-dark text-white border-secondary border-opacity-50" placeholder="John Doe" required>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="reg_email" class="form-label text-secondary small fw-semibold">Email Address</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary">
                                                <i class="bi bi-envelope"></i>
                                            </span>
                                            <input type="email" name="email" id="reg_email" class="form-control bg-dark text-white border-secondary border-opacity-50" placeholder="john@example.com" required>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="reg_password" class="form-label text-secondary small fw-semibold">Password</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary">
                                                <i class="bi bi-lock"></i>
                                            </span>
                                            <input type="password" name="password" id="reg_password" class="form-control bg-dark text-white border-secondary border-opacity-50" placeholder="At least 6 characters" minlength="6" required>
                                        </div>
                                    </div>

                                    <button type="submit" class="btn btn-indigo w-100 py-2 fs-6 mt-3">
                                        <i class="bi bi-person-plus me-1"></i> Register Account for {{ $shop->name }}
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>
                @endif

            </div>
        </div>
    </div>

    <!-- Forgot Password Modal -->
    <div class="modal fade" id="forgotPasswordModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-white border border-secondary border-opacity-50">
                <div class="modal-header border-secondary border-opacity-25">
                    <h5 class="modal-title fw-bold"><i class="bi bi-key text-warning me-2"></i> Password Reset</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p class="text-secondary small mb-3">
                        Please contact your shop administrator or owner for <strong>{{ $shop->name }}</strong> to reset your staff credentials.
                    </p>
                    <div class="p-3 bg-secondary bg-opacity-10 rounded border border-secondary border-opacity-25 small text-light">
                        <i class="bi bi-info-circle me-1 text-info"></i> For owner account recovery, contact system support or visit the platform administration portal.
                    </div>
                </div>
                <div class="modal-footer border-secondary border-opacity-25">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="py-3 border-top border-secondary border-opacity-25 bg-dark bg-opacity-50 text-center text-secondary small">
        <div class="container">
            <p class="mb-0">Secured Shop Access for <strong>{{ $shop->name }}</strong> — GlobalShop Multi-Tenant System</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
