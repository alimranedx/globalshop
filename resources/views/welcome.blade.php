<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Shop Marketplace - Platform Admin Simulator</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0a0a0c;
            --bg-surface: rgba(20, 20, 25, 0.7);
            --bg-card: rgba(30, 30, 38, 0.4);
            --border-glow: rgba(99, 102, 241, 0.15);
            --border-light: rgba(255, 255, 255, 0.08);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --color-accent: #6366f1; /* Indigo */
            --color-accent-glow: rgba(99, 102, 241, 0.4);
            --color-success: #10b981;
            --color-danger: #ef4444;
            --color-warning: #f59e0b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Outfit', sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        body {
            background-color: var(--bg-primary);
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 40%);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 2rem;
            overflow-x: hidden;
        }

        /* Top Title Card */
        header {
            margin-bottom: 2rem;
            text-align: center;
        }

        h1 {
            font-size: 2.2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #fff 0%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
        }

        /* Simulator Container */
        .simulator-grid {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 2rem;
            max-width: 1400px;
            width: 100%;
            margin: 0 auto;
            flex-grow: 1;
        }

        /* Left Side: Session controller */
        .session-panel {
            background: var(--bg-surface);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-light);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .section-title {
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-accent);
            border-bottom: 1px solid var(--border-light);
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .btn-init {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #fff;
            padding: 0.75rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        .btn-init:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
        }

        /* Profile list selection */
        .profile-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .profile-btn {
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            color: var(--text-primary);
            padding: 0.8rem;
            border-radius: 8px;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .profile-btn:hover {
            background: rgba(99, 102, 241, 0.1);
            border-color: var(--color-accent);
        }

        .profile-btn.active {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%);
            border-color: var(--color-accent);
            box-shadow: 0 0 12px var(--border-glow);
        }

        .profile-btn span.role-tag {
            font-size: 0.7rem;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .tag-superadmin { background: #ef4444; color: #fff; }
        .tag-admin { background: #ea580c; color: #fff; }
        .tag-owner { background: #10b981; color: #fff; }
        .tag-manager { background: #6366f1; color: #fff; }
        .tag-worker { background: #f59e0b; color: #fff; }
        .tag-customer { background: #8b5cf6; color: #fff; }
        .tag-guest { background: #6b7280; color: #fff; }

        /* Session State Display */
        .session-info {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 1rem;
            font-size: 0.85rem;
            border: 1px dashed var(--border-light);
        }

        .session-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }

        .session-info-row:last-child {
            margin-bottom: 0;
        }

        .session-info-label {
            color: var(--text-secondary);
        }

        .session-info-value {
            font-weight: 500;
        }

        /* Right Side: Main Workspace */
        .workspace {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .workspace-card {
            background: var(--bg-surface);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-light);
            border-radius: 16px;
            padding: 1.8rem;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            position: relative;
        }

        .card-header-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-light);
            padding-bottom: 0.75rem;
        }

        .card-header-flex h2 {
            font-size: 1.25rem;
            font-weight: 600;
        }

        /* Catalog Layout */
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 1.5rem;
        }

        .product-card {
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }

        .product-card:hover {
            transform: translateY(-4px);
            border-color: rgba(99, 102, 241, 0.4);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .product-name {
            font-weight: 600;
            font-size: 1rem;
        }

        .product-meta {
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
        }

        .product-price {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--color-success);
            margin-top: 0.5rem;
        }

        /* Platform Console Menu Buttons */
        .admin-console-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }

        .console-btn {
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            color: var(--text-primary);
            padding: 1rem;
            border-radius: 10px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .console-btn:hover {
            background: rgba(99, 102, 241, 0.1);
            border-color: var(--color-accent);
            transform: translateY(-2px);
        }

        /* Action Buttons */
        .btn-primary {
            background: var(--color-accent);
            color: #fff;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-primary:hover {
            background: #4f46e5;
            box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
        }

        .btn-danger {
            background: var(--color-danger);
            color: #fff;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-danger:hover {
            background: #dc2626;
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
        }

        /* Lock Screen Panel */
        .lock-panel {
            background: rgba(10, 10, 12, 0.9);
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            text-align: center;
            padding: 2rem;
            backdrop-filter: blur(8px);
        }

        .lock-icon {
            font-size: 3rem;
            color: var(--color-danger);
            animation: pulse 2s infinite;
        }

        .lock-title {
            font-size: 1.3rem;
            font-weight: 700;
        }

        .lock-desc {
            color: var(--text-secondary);
            font-size: 0.9rem;
            max-width: 400px;
        }

        /* Checkbox dynamic permission trees */
        .tree-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .tree-module {
            background: rgba(0, 0, 0, 0.15);
            border-radius: 8px;
            border: 1px solid var(--border-light);
            padding: 1rem;
        }

        .tree-module-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .tree-submodule {
            margin-left: 1.5rem;
            border-left: 1px dashed var(--border-light);
            padding-left: 1rem;
            margin-bottom: 0.5rem;
        }

        .tree-submodule-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            font-size: 0.9rem;
            color: var(--color-accent);
            margin-bottom: 0.3rem;
        }

        .tree-pages {
            margin-left: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        }

        .tree-page-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }

        /* Logs Timeline */
        .timeline {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            max-height: 250px;
            overflow-y: auto;
            padding-right: 0.5rem;
        }

        .timeline-item {
            background: rgba(0, 0, 0, 0.15);
            border: 1px solid var(--border-light);
            padding: 0.8rem;
            border-radius: 8px;
            font-size: 0.8rem;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }

        .timeline-header {
            display: flex;
            justify-content: space-between;
            font-weight: 600;
        }

        .timeline-action {
            color: var(--color-accent);
        }

        .timeline-time {
            color: var(--text-secondary);
            font-size: 0.75rem;
        }

        /* Alert notifications */
        .alert-box {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            z-index: 100;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            display: none;
            animation: slideIn 0.3s ease;
        }

        .alert-success { background: var(--color-success); color: #fff; }
        .alert-danger { background: var(--color-danger); color: #fff; }

        @keyframes slideIn {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>

    <header>
        <h1>Global Shop Marketplace</h1>
        <p class="subtitle">Platform Admin Permissions & Authorization Simulator</p>
    </header>

    <div class="simulator-grid">
        <!-- Left Panel -->
        <aside class="session-panel">
            <button class="btn-init" onclick="initDemo()">Initialize Demo Database</button>

            <div>
                <div class="section-title">Authenticate Role</div>
                <div class="profile-list">
                    <button class="profile-btn active" id="btn-login-superadmin" onclick="login('superadmin@marketplace.com', this)">
                        <span>Super Admin</span>
                        <span class="role-tag tag-superadmin">Global</span>
                    </button>
                    <button class="profile-btn" id="btn-login-grace" onclick="login('grace@marketplace.com', this)">
                        <span>Grace Admin</span>
                        <span class="role-tag tag-admin">Admin</span>
                    </button>
                    <button class="profile-btn" onclick="login('john@alpha.com', this)">
                        <span>John Owner</span>
                        <span class="role-tag tag-owner">Owner</span>
                    </button>
                    <button class="profile-btn" onclick="login('bob@alpha.com', this)">
                        <span>Bob Manager</span>
                        <span class="role-tag tag-manager">Manager</span>
                    </button>
                    <button class="profile-btn" onclick="login('charlie@alpha.com', this)">
                        <span>Charlie Worker</span>
                        <span class="role-tag tag-worker">Worker</span>
                    </button>
                    <button class="profile-btn" onclick="login('alice@customer.com', this)">
                        <span>Alice Customer</span>
                        <span class="role-tag tag-customer">Customer</span>
                    </button>
                    <button class="profile-btn" onclick="logout(this)">
                        <span>Guest</span>
                        <span class="role-tag tag-guest">Public</span>
                    </button>
                </div>
            </div>

            <div>
                <div class="section-title">Active Scope Session</div>
                <div class="session-info">
                    <div class="session-info-row">
                        <span class="session-info-label">Active User:</span>
                        <span class="session-info-value" id="session-user">Guest</span>
                    </div>
                    <div class="session-info-row">
                        <span class="session-info-label">Active Role:</span>
                        <span class="session-info-value" id="session-role">None</span>
                    </div>
                    <div class="session-info-row">
                        <span class="session-info-label">Tenant ID:</span>
                        <span class="session-info-value" id="session-tenant">-</span>
                    </div>
                    <div class="session-info-row">
                        <span class="session-info-label">Tenant Status:</span>
                        <span class="session-info-value" id="session-status">-</span>
                    </div>
                    <div class="session-info-row">
                        <span class="session-info-label">Product Limit:</span>
                        <span class="session-info-value" id="session-quota">-</span>
                    </div>
                </div>
            </div>

            <div id="superadmin-controls" style="display: none;">
                <div class="section-title">Admin Sandbox Toggles</div>
                <button class="btn-danger" id="btn-toggle-suspension" onclick="toggleSuspension()" style="width: 100%;">Suspend Shop Alpha</button>
            </div>
        </aside>

        <!-- Right Workspace -->
        <main class="workspace">
            <!-- Gateway: Registration & Login -->
            <section class="workspace-card" id="gateway-card">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Registration Column -->
                    <div style="border-right: 1px solid var(--border-light); padding-right: 2rem;">
                        <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-accent);">Register New Shop Owner</h3>
                        <form id="register-owner-form" onsubmit="handleRealRegister(event)" style="display: flex; flex-direction: column; gap: 0.8rem;">
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.8rem; color: var(--text-secondary);">Full Name</label>
                                <input type="text" id="reg-name" required placeholder="John Owner" style="background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); padding: 0.5rem; border-radius: 6px; outline: none; width: 100%;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.8rem; color: var(--text-secondary);">Email Address</label>
                                <input type="email" id="reg-email" required placeholder="john@newshop.com" style="background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); padding: 0.5rem; border-radius: 6px; outline: none; width: 100%;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.8rem; color: var(--text-secondary);">Password</label>
                                <input type="password" id="reg-password" required placeholder="••••••••" style="background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); padding: 0.5rem; border-radius: 6px; outline: none; width: 100%;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.8rem; color: var(--text-secondary);">Shop Name</label>
                                <input type="text" id="reg-shop-name" required placeholder="My Awesome Shop" style="background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); padding: 0.5rem; border-radius: 6px; outline: none; width: 100%;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.8rem; color: var(--text-secondary);">Shop Subdomain Slug</label>
                                <input type="text" id="reg-shop-slug" required placeholder="my-shop" style="background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); padding: 0.5rem; border-radius: 6px; outline: none; width: 100%;">
                            </div>
                            <button type="submit" class="btn-primary" style="margin-top: 0.5rem;">Register Shop</button>
                        </form>
                    </div>

                    <!-- Login Column -->
                    <div>
                        <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-success);">Real Credentials Login</h3>
                        <form id="real-login-form" onsubmit="handleRealLogin(event)" style="display: flex; flex-direction: column; gap: 0.8rem;">
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.8rem; color: var(--text-secondary);">Email Address</label>
                                <input type="email" id="login-email" required placeholder="john@newshop.com" style="background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); padding: 0.5rem; border-radius: 6px; outline: none; width: 100%;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.8rem; color: var(--text-secondary);">Password</label>
                                <input type="password" id="login-password" required placeholder="••••••••" style="background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); padding: 0.5rem; border-radius: 6px; outline: none; width: 100%;">
                            </div>
                            <button type="submit" class="btn-primary" style="margin-top: 0.5rem; background: var(--color-success);">Log In</button>
                        </form>
                    </div>
                </div>
            </section>

            <!-- 1. Platform Administration Console (Admin Pages test) -->
            <section class="workspace-card" id="admin-console-card" style="display: none;">
                <div class="card-header-flex">
                    <h2>Platform Administration Console</h2>
                </div>
                <div class="admin-console-grid">
                    <button class="console-btn" id="btn-page-shops" onclick="accessPlatformPage('admin.shops', 'Platform Shop Directory')">
                        🏢 Shop Directory
                    </button>
                    <button class="console-btn" id="btn-page-plans" onclick="accessPlatformPage('admin.plans', 'Subscription Plans Quotas')">
                        💳 Plan Quotas
                    </button>
                    <button class="console-btn" id="btn-page-logs" onclick="accessPlatformPage('admin.logs', 'Platform System Logs')">
                        📜 System Logs
                    </button>
                    <button class="console-btn" id="btn-page-admins" onclick="accessPlatformPage('admin.admins', 'Admin Accounts Management')">
                        👥 Manage Admins
                    </button>
                </div>
            </section>

            <!-- 2. Catalog Panel -->
            <section class="workspace-card" id="catalog-card">
                <!-- Locked Cover -->
                <div class="lock-panel" id="catalog-lock" style="display: none;">
                    <div class="lock-icon">🔒</div>
                    <div class="lock-title">Access Denied (403 Forbidden)</div>
                    <div class="lock-desc">The middleware <code>AuthorizePageAccess</code> intercepted this request. Your active role lacks the <code>products.index</code> page permission registry.</div>
                </div>

                <div class="card-header-flex">
                    <h2 id="catalog-title">Product Catalog Manager</h2>
                    <button class="btn-primary" id="btn-add-product" onclick="addProduct()" style="display: none;">Add Mock Product</button>
                </div>

                <div class="product-grid" id="product-container">
                    <!-- Products dynamically rendered -->
                </div>
            </section>

            <!-- 3. Dynamic Permissions Tree (Tenant Roles) -->
            <section class="workspace-card" id="permissions-card" style="display: none;">
                <div class="card-header-flex">
                    <h2>Role Permissions Configuration Matrix</h2>
                    <button class="btn-primary" onclick="savePermissions()">Save Manager Permissions</button>
                </div>
                <div class="tree-container" id="tree-container">
                    <!-- Checkbox tree dynamic render -->
                </div>
            </section>

            <!-- 4. Dynamic Platform Admin Permissions (Super Admin Only) -->
            <section class="workspace-card" id="admin-permissions-card" style="display: none;">
                <div class="card-header-flex">
                    <h2>Platform Admin Permissions Configurator</h2>
                    <button class="btn-primary" id="btn-save-admin-perms" onclick="saveAdminPermissions()">Save Admin Grace Permissions</button>
                </div>
                <div class="tree-container" id="admin-tree-container">
                    <!-- Platform checkboxes -->
                </div>
            </section>

            <!-- 5. Audit Trails -->
            <section class="workspace-card">
                <div class="card-header-flex">
                    <h2>SaaS System Operations Audit Trail</h2>
                </div>
                <div class="timeline" id="timeline-container">
                    <!-- Logs list -->
                </div>
            </section>
        </main>
    </div>

    <!-- Alert Box -->
    <div class="alert-box" id="alert-box">Action completed successfully</div>

    <script>
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // Cache active session profile permissions for local mock checks
        let activeAdminPermissions = [];
        let activeUserEmail = '';

        async function handleRealRegister(e) {
            e.preventDefault();
            const payload = {
                owner_name: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                shop_name: document.getElementById('reg-shop-name').value,
                shop_slug: document.getElementById('reg-shop-slug').value,
            };

            try {
                const response = await fetch('/api/v1/auth/register-owner', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    },
                    body: JSON.stringify(payload)
                });
                const res = await response.json();
                if (res.success) {
                    showAlert(res.message);
                    document.getElementById('reg-name').value = '';
                    document.getElementById('reg-email').value = '';
                    document.getElementById('reg-password').value = '';
                    document.getElementById('reg-shop-name').value = '';
                    document.getElementById('reg-shop-slug').value = '';
                    updateState();
                } else {
                    showAlert(res.message || 'Registration failed.', true);
                }
            } catch (error) {
                showAlert('Registration failed.', true);
            }
        }

        async function handleRealLogin(e) {
            e.preventDefault();
            const payload = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value,
            };

            try {
                const response = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    },
                    body: JSON.stringify(payload)
                });
                const res = await response.json();
                if (res.success) {
                    showAlert(res.message || 'Logged in successfully');
                    document.getElementById('login-email').value = '';
                    document.getElementById('login-password').value = '';
                    
                    // Highlight custom profile if matches
                    document.querySelectorAll('.profile-list button').forEach(btn => btn.classList.remove('active'));
                    updateState();
                } else {
                    showAlert(res.message || 'Invalid credentials.', true);
                }
            } catch (error) {
                showAlert('Login failed.', true);
            }
        }

        window.onload = function() {
            login('superadmin@marketplace.com', document.getElementById('btn-login-superadmin'));
        };

        function showAlert(message, isError = false) {
            const alert = document.getElementById('alert-box');
            alert.innerText = message;
            alert.className = 'alert-box ' + (isError ? 'alert-danger' : 'alert-success');
            alert.style.display = 'block';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 4000);
        }

        async function initDemo() {
            if (!confirm('⚠️ WARNING: Are you sure you want to initialize the demo database? This will completely clear all current sales transactions, products, categories, brands, and rebuild the catalog.')) {
                return;
            }
            try {
                const response = await fetch('/demo/reset', {

                    method: 'POST',
                    headers: { 
                        'X-CSRF-TOKEN': token,
                        'Accept': 'application/json'
                    }

                });
                const res = await response.json();
                if (res.success) {
                    showAlert(res.message);
                    updateState();
                }
            } catch (error) {
                showAlert('Database initialization failed.', true);
            }
        }

        async function login(email, btnElement) {
            document.querySelectorAll('.profile-list button').forEach(btn => btn.classList.remove('active'));
            if (btnElement) btnElement.classList.add('active');

            try {
                const response = await fetch('/demo/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    },
                    body: JSON.stringify({ email: email })
                });
                const res = await response.json();
                if (res.success) {
                    showAlert(`Authenticated successfully as ${res.user.name}`);
                    updateState();
                }
            } catch (error) {
                showAlert('Authentication failed.', true);
            }
        }

        async function logout(btnElement) {
            document.querySelectorAll('.profile-list button').forEach(btn => btn.classList.remove('active'));
            if (btnElement) btnElement.classList.add('active');

            try {
                await fetch('/demo/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    },
                    body: JSON.stringify({ email: 'alice@customer.com' })
                });
                await fetch('/logout');
            } catch (e) {}

            showAlert('Logged out. Browsing as Guest.');
            updateState(true);
        }

        async function updateState(forceGuest = false) {
            try {
                if (forceGuest) {
                    renderGuestState();
                    return;
                }

                const response = await fetch('/demo/state');
                const state = await response.json();

                activeUserEmail = state.user ? state.user.email : '';
                activeAdminPermissions = activeUserEmail === 'superadmin@marketplace.com'
                    ? ['admin.shops', 'admin.plans', 'admin.logs', 'admin.admins']
                    : (state.grace_admin_permissions || []);

                // Update session info
                document.getElementById('session-user').innerText = state.authenticated ? state.user.name : 'Guest';
                document.getElementById('session-role').innerText = state.authenticated ? state.user.role : 'None';
                document.getElementById('session-tenant').innerText = state.shop ? state.shop.name : 'Marketplace (Global)';
                document.getElementById('session-status').innerText = state.shop ? state.shop.status : '-';
                document.getElementById('session-quota').innerText = state.limits ? `${state.limits.current_products} / ${state.limits.max_products}` : '-';

                // Display Platform Admin Panel if the user is a platform admin
                const adminConsoleCard = document.getElementById('admin-console-card');
                if (state.user && state.user.is_platform_admin) {
                    adminConsoleCard.style.display = 'block';
                } else {
                    adminConsoleCard.style.display = 'none';
                }

                // Super Admin Controls
                const superAdminControls = document.getElementById('superadmin-controls');
                if (state.user && state.user.email === 'superadmin@marketplace.com') {
                    superAdminControls.style.display = 'block';
                    document.getElementById('btn-toggle-suspension').innerText = state.shop && state.shop.status === 'suspended' ? 'Activate Shop Alpha' : 'Suspend Shop Alpha';
                } else {
                    superAdminControls.style.display = 'none';
                }

                // Dynamic Platform Admin Configurator (Visible to Super Admin only)
                const adminPermissionsCard = document.getElementById('admin-permissions-card');
                if (state.user && state.user.email === 'superadmin@marketplace.com') {
                    adminPermissionsCard.style.display = 'block';
                    renderPlatformAdminTree(state.platform_permissions_config, state.grace_admin_permissions);
                } else {
                    adminPermissionsCard.style.display = 'none';
                }

                // Handle catalog protection locks
                const catalogLock = document.getElementById('catalog-lock');
                const btnAddProduct = document.getElementById('btn-add-product');
                
                let hasCatalogAccess = true;
                if (state.authenticated) {
                    const role = state.user.role;
                    if (role === 'Worker' || role === 'Manager') {
                        hasCatalogAccess = state.manager_permissions.includes('products.index');
                    }
                }

                // If platform admin is checking pages, hide catalog manager to emphasize admin views
                if (state.user && state.user.is_platform_admin) {
                    document.getElementById('catalog-card').style.display = 'none';
                } else {
                    document.getElementById('catalog-card').style.display = 'block';
                    if (hasCatalogAccess) {
                        catalogLock.style.display = 'none';
                        document.getElementById('catalog-title').innerText = state.shop ? `${state.shop.name} Catalog Manager` : 'Global Product Search';
                        btnAddProduct.style.display = (state.authenticated && state.user.role !== 'Customer/Guest') ? 'inline-block' : 'none';
                        renderProducts(state.products);
                    } else {
                        catalogLock.style.display = 'flex';
                        renderProducts([]);
                    }
                }

                // Tenant Permissions tree (Visible to Owners & Super Admins)
                const permissionsCard = document.getElementById('permissions-card');
                if (state.authenticated && (state.user.role === 'Owner' || state.user.email === 'superadmin@marketplace.com') && state.shop) {
                    permissionsCard.style.display = 'block';
                    renderPermissionTree(state.permissions_config, state.manager_permissions);
                } else {
                    permissionsCard.style.display = 'none';
                }

                renderLogs(state.activity_logs);

            } catch (error) {
                console.error(error);
            }
        }

        function accessPlatformPage(pageKey, pageLabel) {
            // Check if active user has permission
            if (activeAdminPermissions.includes(pageKey)) {
                showAlert(`Success: Accessed page [${pageLabel}]`);
            } else {
                showAlert(`403 Forbidden: Admin lacks explicit assignment for [${pageKey}]`, true);
            }
        }

        function renderGuestState() {
            document.getElementById('session-user').innerText = 'Guest';
            document.getElementById('session-role').innerText = 'None';
            document.getElementById('session-tenant').innerText = 'Marketplace (Global)';
            document.getElementById('session-status').innerText = '-';
            document.getElementById('session-quota').innerText = '-';
            document.getElementById('superadmin-controls').style.display = 'none';
            document.getElementById('permissions-card').style.display = 'none';
            document.getElementById('admin-permissions-card').style.display = 'none';
            document.getElementById('admin-console-card').style.display = 'none';
            document.getElementById('catalog-card').style.display = 'block';
            document.getElementById('btn-add-product').style.display = 'none';
            document.getElementById('catalog-lock').style.display = 'none';
            document.getElementById('catalog-title').innerText = 'Global Product Search';
            
            fetch('/demo/state')
                .then(r => r.json())
                .then(state => {
                    renderProducts(state.products);
                    renderLogs(state.activity_logs);
                });
        }

        function renderProducts(products) {
            const container = document.getElementById('product-container');
            container.innerHTML = '';
            if (products.length === 0) {
                container.innerHTML = '<div style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">No products found in this scope.</div>';
                return;
            }
            products.forEach(p => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-name">${p.name}</div>
                    <div class="product-meta">
                        <span>Shop: ${p.shop ? p.shop.name : 'Unknown'}</span>
                        <span>Cat: ${p.category ? p.category.name : 'Global'}</span>
                    </div>
                    <div class="product-price">$${p.price.toFixed(2)}</div>
                `;
                container.appendChild(card);
            });
        }

        function renderPermissionTree(config, activePerms) {
            const container = document.getElementById('tree-container');
            container.innerHTML = '';
            Object.keys(config).forEach(moduleKey => {
                const module = config[moduleKey];
                const moduleDiv = document.createElement('div');
                moduleDiv.className = 'tree-module';
                moduleDiv.innerHTML = `
                    <div class="tree-module-header">
                        <input type="checkbox" id="mod-${moduleKey}" onchange="toggleModuleCheckboxes('${moduleKey}', this.checked)">
                        <label for="mod-${moduleKey}">${module.label}</label>
                    </div>
                `;
                const subModulesDiv = document.createElement('div');
                Object.keys(module.sub_modules).forEach(subKey => {
                    const subModule = module.sub_modules[subKey];
                    const subDiv = document.createElement('div');
                    subDiv.className = 'tree-submodule';
                    subDiv.innerHTML = `
                        <div class="tree-submodule-header">
                            <input type="checkbox" id="sub-${subKey}" onchange="toggleSubModuleCheckboxes('${subKey}', this.checked)" data-module="${moduleKey}">
                            <label for="sub-${subKey}">${subModule.label}</label>
                        </div>
                    `;
                    const pagesDiv = document.createElement('div');
                    pagesDiv.className = 'tree-pages';
                    Object.keys(subModule.pages).forEach(pageKey => {
                        const pageLabel = subModule.pages[pageKey];
                        const isChecked = activePerms.includes(pageKey) ? 'checked' : '';
                        const pageItem = document.createElement('div');
                        pageItem.className = 'tree-page-item';
                        pageItem.innerHTML = `
                            <input type="checkbox" name="permissions[]" value="${pageKey}" id="page-${pageKey}" ${isChecked} onchange="updateParentCheckboxes()" data-module="${moduleKey}" data-sub="${subKey}">
                            <label for="page-${pageKey}">${pageLabel} (<code>${pageKey}</code>)</label>
                        `;
                        pagesDiv.appendChild(pageItem);
                    });
                    subDiv.appendChild(pagesDiv);
                    subModulesDiv.appendChild(subDiv);
                });
                moduleDiv.appendChild(subModulesDiv);
                container.appendChild(moduleDiv);
            });
            updateParentCheckboxes();
        }

        function renderPlatformAdminTree(config, activePerms) {
            const container = document.getElementById('admin-tree-container');
            container.innerHTML = '';

            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'tree-module';
            moduleDiv.innerHTML = `
                <div class="tree-module-header">
                    <input type="checkbox" id="admin-mod-root" onchange="toggleAdminCheckboxes(this.checked)">
                    <label for="admin-mod-root">${config.label}</label>
                </div>
            `;
            const subModulesDiv = document.createElement('div');
            Object.keys(config.sub_modules).forEach(subKey => {
                const subModule = config.sub_modules[subKey];
                const subDiv = document.createElement('div');
                subDiv.className = 'tree-submodule';
                subDiv.innerHTML = `
                    <div class="tree-submodule-header">
                        <input type="checkbox" id="admin-sub-${subKey}" onchange="toggleAdminSubCheckboxes('${subKey}', this.checked)">
                        <label for="admin-sub-${subKey}">${subModule.label}</label>
                    </div>
                `;
                const pagesDiv = document.createElement('div');
                pagesDiv.className = 'tree-pages';
                Object.keys(subModule.pages).forEach(pageKey => {
                    const pageLabel = subModule.pages[pageKey];
                    const isChecked = activePerms.includes(pageKey) ? 'checked' : '';
                    const pageItem = document.createElement('div');
                    pageItem.className = 'tree-page-item';
                    pageItem.innerHTML = `
                        <input type="checkbox" name="admin_permissions[]" value="${pageKey}" id="admin-page-${pageKey}" ${isChecked} onchange="updateAdminParentCheckboxes()" data-sub="${subKey}">
                        <label for="admin-page-${pageKey}">${pageLabel} (<code>${pageKey}</code>)</label>
                    `;
                    pagesDiv.appendChild(pageItem);
                });
                subDiv.appendChild(pagesDiv);
                subModulesDiv.appendChild(subDiv);
            });
            moduleDiv.appendChild(subModulesDiv);
            container.appendChild(moduleDiv);
            updateAdminParentCheckboxes();
        }

        function toggleAdminCheckboxes(checked) {
            document.querySelectorAll('input[name="admin_permissions[]"]').forEach(cb => {
                cb.checked = checked;
            });
            updateAdminParentCheckboxes();
        }

        function toggleAdminSubCheckboxes(subKey, checked) {
            document.querySelectorAll(`input[data-sub="${subKey}"]`).forEach(cb => {
                cb.checked = checked;
            });
            updateAdminParentCheckboxes();
        }

        function updateAdminParentCheckboxes() {
            const submodules = document.querySelectorAll('#admin-tree-container .tree-submodule');
            submodules.forEach(sub => {
                const subCheckbox = sub.querySelector('.tree-submodule-header input');
                const pageCheckboxes = sub.querySelectorAll('.tree-pages input');
                let checkedCount = 0;
                pageCheckboxes.forEach(cb => { if (cb.checked) checkedCount++; });

                if (checkedCount === 0) {
                    subCheckbox.checked = false;
                    subCheckbox.indeterminate = false;
                } else if (checkedCount === pageCheckboxes.length) {
                    subCheckbox.checked = true;
                    subCheckbox.indeterminate = false;
                } else {
                    subCheckbox.checked = false;
                    subCheckbox.indeterminate = true;
                }
            });

            const modCheckbox = document.getElementById('admin-mod-root');
            if (modCheckbox) {
                const subCheckboxes = document.querySelectorAll('#admin-tree-container .tree-submodule-header input');
                let checkedCount = 0;
                let indeterminateCount = 0;
                subCheckboxes.forEach(cb => {
                    if (cb.checked) checkedCount++;
                    if (cb.indeterminate) indeterminateCount++;
                });

                if (checkedCount === 0 && indeterminateCount === 0) {
                    modCheckbox.checked = false;
                    modCheckbox.indeterminate = false;
                } else if (checkedCount === subCheckboxes.length) {
                    modCheckbox.checked = true;
                    modCheckbox.indeterminate = false;
                } else {
                    modCheckbox.checked = false;
                    modCheckbox.indeterminate = true;
                }
            }
        }

        function toggleModuleCheckboxes(moduleKey, checked) {
            document.querySelectorAll(`input[data-module="${moduleKey}"]`).forEach(cb => {
                cb.checked = checked;
                cb.indeterminate = false;
            });
        }

        function toggleSubModuleCheckboxes(subKey, checked) {
            document.querySelectorAll(`input[data-sub="${subKey}"]`).forEach(cb => {
                cb.checked = checked;
            });
            updateParentCheckboxes();
        }

        function updateParentCheckboxes() {
            const submodules = document.querySelectorAll('#tree-container .tree-submodule');
            submodules.forEach(sub => {
                const subCheckbox = sub.querySelector('.tree-submodule-header input');
                const pageCheckboxes = sub.querySelectorAll('.tree-pages input');
                let checkedCount = 0;
                pageCheckboxes.forEach(cb => { if (cb.checked) checkedCount++; });

                if (checkedCount === 0) {
                    subCheckbox.checked = false;
                    subCheckbox.indeterminate = false;
                } else if (checkedCount === pageCheckboxes.length) {
                    subCheckbox.checked = true;
                    subCheckbox.indeterminate = false;
                } else {
                    subCheckbox.checked = false;
                    subCheckbox.indeterminate = true;
                }
            });

            const modules = document.querySelectorAll('.tree-module');
            modules.forEach(mod => {
                const modCheckbox = mod.querySelector('.tree-module-header input');
                if (modCheckbox && !modCheckbox.id.startsWith('admin-')) {
                    const subCheckboxes = mod.querySelectorAll('.tree-submodule-header input');
                    let checkedCount = 0;
                    let indeterminateCount = 0;
                    subCheckboxes.forEach(cb => {
                        if (cb.checked) checkedCount++;
                        if (cb.indeterminate) indeterminateCount++;
                    });

                    if (checkedCount === 0 && indeterminateCount === 0) {
                        modCheckbox.checked = false;
                        modCheckbox.indeterminate = false;
                    } else if (checkedCount === subCheckboxes.length) {
                        modCheckbox.checked = true;
                        modCheckbox.indeterminate = false;
                    } else {
                        modCheckbox.checked = false;
                        modCheckbox.indeterminate = true;
                    }
                }
            });
        }

        async function savePermissions() {
            const checkedBoxes = document.querySelectorAll('input[name="permissions[]"]:checked');
            const pages = Array.from(checkedBoxes).map(cb => cb.value);

            try {
                const response = await fetch('/demo/permissions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    },
                    body: JSON.stringify({ pages: pages })
                });
                const res = await response.json();
                if (res.success) {
                    showAlert('Manager permissions synchronized successfully.');
                    updateState();
                }
            } catch (error) {
                showAlert('Failed to save permissions.', true);
            }
        }

        async function saveAdminPermissions() {
            const checkedBoxes = document.querySelectorAll('input[name="admin_permissions[]"]:checked');
            const pages = Array.from(checkedBoxes).map(cb => cb.value);

            try {
                const response = await fetch('/demo/admin-permissions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    },
                    body: JSON.stringify({ pages: pages })
                });
                const res = await response.json();
                if (res.success) {
                    showAlert('Grace Admin permissions synchronized successfully.');
                    updateState();
                }
            } catch (error) {
                showAlert('Failed to save Admin permissions.', true);
            }
        }

        async function addProduct() {
            const names = ['Sneakers Ultra X', 'Leather jacket Red', 'Smart Fit Jeans', 'Classic Fedora Hat'];
            const name = names[Math.floor(Math.random() * names.length)];
            const price = parseFloat((Math.random() * 150 + 20).toFixed(2));

            try {
                const response = await fetch('/demo/product', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    },
                    body: JSON.stringify({ name: name, price: price })
                });
                const res = await response.json();
                if (res.success) {
                    showAlert(`Added catalog product: ${res.product.name}`);
                    updateState();
                } else {
                    showAlert(res.message, true);
                }
            } catch (error) {
                showAlert('Validation check failed.', true);
            }
        }

        async function toggleSuspension() {
            try {
                const response = await fetch('/demo/toggle-suspension', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': token }
                });
                const res = await response.json();
                if (res.success) {
                    showAlert(`Shop Alpha status toggled to: ${res.new_status}`);
                    updateState();
                }
            } catch (error) {
                showAlert('Action failed.', true);
            }
        }

        function renderLogs(logs) {
            const container = document.getElementById('timeline-container');
            container.innerHTML = '';
            if (logs.length === 0) {
                container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 1rem;">No activity log records.</div>';
                return;
            }
            logs.forEach(log => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                const time = new Date(log.created_at).toLocaleTimeString();
                item.innerHTML = `
                    <div class="timeline-header">
                        <span class="timeline-action">${log.action}</span>
                        <span class="timeline-time">${time}</span>
                    </div>
                    <div>${log.description}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.2rem;">
                        IP: ${log.ip_address} | Device: ${log.device_type}
                    </div>
                `;
                container.appendChild(item);
            });
        }
    </script>
</body>
</html>
