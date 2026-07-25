<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Shop - Platform Administration Console</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0a0a0c;
            --bg-surface: rgba(20, 20, 25, 0.75);
            --bg-card: rgba(30, 30, 38, 0.45);
            --border-glow: rgba(99, 102, 241, 0.18);
            --border-light: rgba(255, 255, 255, 0.08);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --color-accent: #6366f1;
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
                radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 40%);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
        }

        /* Dashboard Layout */
        .dashboard-container {
            display: grid;
            grid-template-columns: 280px 1fr;
            min-height: 100vh;
        }

        /* Sidebar styling */
        aside {
            background: rgba(15, 15, 20, 0.85);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--border-light);
            padding: 2rem 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .brand-logo {
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #fff 0%, var(--color-accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.03em;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            list-style: none;
        }

        .nav-item button {
            width: 100%;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            padding: 0.8rem 1rem;
            text-align: left;
            font-size: 0.95rem;
            font-weight: 500;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .nav-item button:hover {
            color: var(--text-primary);
            background: rgba(255, 255, 255, 0.03);
        }

        .nav-item.active button {
            color: #fff;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.08) 100%);
            border: 1px solid var(--color-accent);
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
        }

        /* Top Bar */
        .topbar {
            background: rgba(15, 15, 20, 0.4);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-light);
            padding: 1rem 2.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .topbar-title {
            font-size: 1.25rem;
            font-weight: 600;
        }

        .user-profile-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .role-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }

        .role-superadmin { background: var(--color-danger); color: #fff; }
        .role-admin { background: var(--color-warning); color: #000; }

        .btn-logout {
            background: transparent;
            border: 1px solid var(--border-light);
            color: var(--text-secondary);
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-logout:hover {
            color: var(--text-primary);
            border-color: var(--text-secondary);
        }

        /* Main view container */
        main {
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            overflow-y: auto;
            max-height: calc(100vh - 65px);
        }

        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .stat-title {
            font-size: 0.85rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #fff;
        }

        /* Card panels */
        .panel {
            background: var(--bg-surface);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-light);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            display: none;
            flex-direction: column;
            gap: 1.5rem;
        }

        .panel.active {
            display: flex;
        }

        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-light);
            padding-bottom: 1rem;
            margin-bottom: 0.5rem;
        }

        .panel-header h2 {
            font-size: 1.4rem;
            font-weight: 600;
        }

        /* Table Design */
        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9rem;
        }

        th {
            color: var(--text-secondary);
            font-weight: 600;
            padding: 1rem;
            border-bottom: 2px solid var(--border-light);
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid var(--border-light);
            color: var(--text-primary);
        }

        tr:hover td {
            background: rgba(255, 255, 255, 0.02);
        }

        /* Status Toggles */
        .status-badge {
            display: inline-block;
            font-size: 0.75rem;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-active { background: rgba(16, 185, 129, 0.15); color: var(--color-success); }
        .status-suspended { background: rgba(239, 68, 68, 0.15); color: var(--color-danger); }

        /* General Forms */
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-group label {
            font-size: 0.85rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .form-group input, .form-group select {
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            color: #fff;
            padding: 0.75rem;
            border-radius: 8px;
            outline: none;
            transition: all 0.2s ease;
        }

        .form-group input:focus, .form-group select:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
        }

        .btn-action {
            background: var(--color-accent);
            color: #fff;
            border: none;
            padding: 0.7rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
        }

        .btn-action:hover {
            background: #4f46e5;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }

        .btn-danger {
            background: var(--color-danger);
            color: #fff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-danger:hover {
            background: #dc2626;
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
        }

        .btn-success {
            background: var(--color-success);
            color: #fff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-success:hover {
            background: #059669;
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
        }

        /* Checkbox Trees */
        .tree-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .tree-module {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            border: 1px solid var(--border-light);
            padding: 1.25rem;
        }

        .tree-module-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.75rem;
        }

        .tree-submodule {
            margin-left: 1.5rem;
            border-left: 1px dashed var(--border-light);
            padding-left: 1.25rem;
            margin-bottom: 0.75rem;
        }

        .tree-submodule-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            font-size: 0.95rem;
            color: var(--color-accent);
            margin-bottom: 0.5rem;
        }

        .tree-pages {
            margin-left: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .tree-page-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }

        /* Alert notifications */
        .toast-box {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
            display: none;
            animation: slideIn 0.3s ease;
        }

        .toast-success { background: var(--color-success); color: #fff; }
        .toast-danger { background: var(--color-danger); color: #fff; }

        @keyframes slideIn {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        /* Role Swapping Simulation Bar */
        .simulator-selector-bar {
            background: rgba(99, 102, 241, 0.08);
            border: 1px solid rgba(99, 102, 241, 0.2);
            padding: 0.6rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
        }

        .simulator-select {
            background: #141419;
            border: 1px solid var(--border-light);
            color: #fff;
            padding: 0.3rem 0.6rem;
            border-radius: 6px;
            outline: none;
            cursor: pointer;
        }
    </style>
</head>
<body>

    <!-- Simulator Role Selector Helper -->
    <div class="simulator-selector-bar">
        <span>⚙️ <strong>SaaS Admin Panel Simulator</strong></span>
        <div>
            <span>Active Admin Context: </span>
            <select class="simulator-select" onchange="simulateRoleLogin(this.value)">
                <option value="superadmin@marketplace.com" id="opt-superadmin">Super Admin (All Access)</option>
                <option value="grace@marketplace.com" id="opt-grace">Grace Admin (Explicit Permissions)</option>
            </select>
        </div>
    </div>

    <div class="dashboard-container">
        <!-- Sidebar Navigation -->
        <aside>
            <div class="brand-logo">
                <span>🛒</span> Global Shop Admin
            </div>
            <ul class="nav-menu">
                <li class="nav-item active" id="nav-overview">
                    <button onclick="switchTab('overview')">📊 Overview</button>
                </li>
                <li class="nav-item" id="nav-shops">
                    <button onclick="switchTab('shops')">🏢 Shop Directory</button>
                </li>
                <li class="nav-item" id="nav-plans">
                    <button onclick="switchTab('plans')">💳 Plan Quotas</button>
                </li>
                <li class="nav-item" id="nav-admins">
                    <button onclick="switchTab('admins')">👥 Manage Admins</button>
                </li>
                <li class="nav-item" id="nav-logs">
                    <button onclick="switchTab('logs')">📜 Platform Logs</button>
                </li>
            </ul>
        </aside>

        <!-- Right Side Panel Content -->
        <div style="display: flex; flex-direction: column; width: 100%;">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-title" id="current-tab-title">Platform Overview</div>
                <div class="user-profile-controls">
                    <span class="role-badge role-superadmin" id="active-user-badge">Super Admin</span>
                    <span id="active-user-name" style="font-weight: 500;">Super Admin</span>
                    <button class="btn-logout" onclick="window.location.href='/'">Exit Panel</button>
                </div>
            </div>

            <!-- Main Content Area -->
            <main>
                <!-- Overview Panel -->
                <div class="panel active" id="panel-overview">
                    <div class="stats-grid" id="overview-stats">
                        <!-- Loaded dynamically -->
                    </div>
                    <div class="panel-header" style="margin-top: 1rem;">
                        <h2>Recent Audit Operations</h2>
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="overview-logs-table">
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Description</th>
                                    <th>IP Address</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody id="overview-logs-tbody">
                                <!-- Loaded dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Shop Directory Panel -->
                <div class="panel" id="panel-shops">
                    <div class="panel-header">
                        <h2>SaaS Merchant Directory</h2>
                    </div>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Shop Name</th>
                                    <th>Subdomain (Slug)</th>
                                    <th>Owner</th>
                                    <th>Active Subscription</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="shops-tbody">
                                <!-- Loaded dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Plan Quotas Panel -->
                <div class="panel" id="panel-plans">
                    <div class="panel-header">
                        <h2>Subscription Plans Configuration</h2>
                    </div>
                    
                    <!-- Create / Edit Plan Form -->
                    <form id="plan-form" onsubmit="savePlan(event)" style="background: rgba(0,0,0,0.15); padding: 1.5rem; border-radius: 10px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 1.25rem;">
                        <h3 id="plan-form-title" style="font-size: 1.1rem; font-weight: 600;">Create New Subscription Plan</h3>
                        <input type="hidden" id="plan-id">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="plan-name">Plan Name</label>
                                <input type="text" id="plan-name" required placeholder="e.g., Enterprise Plan">
                            </div>
                            <div class="form-group">
                                <label for="plan-price">Monthly Price ($)</label>
                                <input type="number" id="plan-price" required step="0.01" min="0" placeholder="e.g., 99.00">
                            </div>
                            <div class="form-group">
                                <label for="limit-products">Max Products Quota</label>
                                <input type="number" id="limit-products" required min="1" placeholder="e.g., 100">
                            </div>
                            <div class="form-group">
                                <label for="limit-images">Max Images Per Product</label>
                                <input type="number" id="limit-images" required min="1" placeholder="e.g., 5">
                            </div>
                            <div class="form-group">
                                <label for="limit-employees">Max Employee Accounts</label>
                                <input type="number" id="limit-employees" required min="1" placeholder="e.g., 15">
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                            <button type="submit" class="btn-action">Save Subscription Plan</button>
                            <button type="button" class="btn-logout" onclick="resetPlanForm()">Clear Form</button>
                        </div>
                    </form>

                    <div style="overflow-x: auto; margin-top: 1rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Plan Name</th>
                                    <th>Price</th>
                                    <th>Limits (Products / Images / Employees)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="plans-tbody">
                                <!-- Loaded dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Manage Admins Panel -->
                <div class="panel" id="panel-admins">
                    <div class="panel-header">
                        <h2>Platform Administrators Directory</h2>
                    </div>

                    <!-- Create Admin Account Form -->
                    <form id="admin-form" onsubmit="createAdminAccount(event)" style="background: rgba(0,0,0,0.15); padding: 1.5rem; border-radius: 10px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 1.25rem;">
                        <h3 style="font-size: 1.1rem; font-weight: 600;">Create Platform Admin Account</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="admin-name">Full Name</label>
                                <input type="text" id="admin-name" required placeholder="e.g. Grace Cooper">
                            </div>
                            <div class="form-group">
                                <label for="admin-email">Email Address</label>
                                <input type="email" id="admin-email" required placeholder="e.g. grace@marketplace.com">
                            </div>
                            <div class="form-group">
                                <label for="admin-password">Password</label>
                                <input type="password" id="admin-password" required minlength="6" placeholder="Min 6 characters">
                            </div>
                        </div>
                        <div style="margin-top: 0.5rem;">
                            <button type="submit" class="btn-action">Create Administrator</button>
                        </div>
                    </form>

                    <!-- Permissions Configurator for Admins (Super Admin Only) -->
                    <div id="admin-permissions-section" style="display: flex; flex-direction: column; gap: 1rem; background: rgba(0,0,0,0.15); padding: 1.5rem; border-radius: 10px; border: 1px solid var(--border-light);">
                        <h3 style="font-size: 1.1rem; font-weight: 600;">Platform Permission Configurator</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Select an admin below to configure their explicit access nodes. (Super Admin is always bypassed as Root)</p>
                        
                        <div class="form-group" style="max-width: 300px;">
                            <label for="admin-user-selector">Select Admin Account</label>
                            <select id="admin-user-selector" onchange="loadAdminUserPermissions(this.value)">
                                <!-- Loaded dynamically -->
                            </select>
                        </div>

                        <div class="tree-container" id="admin-tree-container" style="margin-top: 1rem;">
                            <!-- Checkbox tree -->
                        </div>

                        <div style="margin-top: 0.5rem;">
                            <button class="btn-action" id="btn-save-admin-perms" onclick="saveAdminPermissions()">Save Admin Access Matrix</button>
                        </div>
                    </div>

                    <div style="overflow-x: auto; margin-top: 1rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Admin Name</th>
                                    <th>Email</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="admins-tbody">
                                <!-- Loaded dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Platform Logs Panel -->
                <div class="panel" id="panel-logs">
                    <div class="panel-header">
                        <h2>SaaS Operations Audit Trail Logs</h2>
                    </div>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Description</th>
                                    <th>Operator</th>
                                    <th>IP Address</th>
                                    <th>Device</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody id="logs-tbody">
                                <!-- Loaded dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Toast Alert notifications -->
    <div class="toast-box" id="toast-box">Action completed successfully</div>

    <script>
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        let currentTab = 'overview';
        let currentUserEmail = 'superadmin@marketplace.com';
        
        let platformPermissionsConfig = {
            label: "Platform Administration",
            sub_modules: {
                management: {
                    label: "Platform Operations",
                    pages: {
                        "admin.shops": "Platform Shop Directory",
                        "admin.plans": "Subscription Plans Quotas",
                        "admin.logs": "Platform System Logs",
                        "admin.admins": "Admin Accounts Management"
                    }
                }
            }
        };

        window.onload = function() {
            // Load state
            loadState();
        };

        function showToast(message, isError = false) {
            const toast = document.getElementById('toast-box');
            toast.innerText = message;
            toast.className = 'toast-box ' + (isError ? 'toast-danger' : 'toast-success');
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 4000);
        }

        async function simulateRoleLogin(email) {
            currentUserEmail = email;
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
                    showToast(`Context switched to ${res.user.name}`);
                    
                    // Update user profile badges
                    document.getElementById('active-user-name').innerText = res.user.name;
                    document.getElementById('active-user-badge').innerText = res.user.role;
                    document.getElementById('active-user-badge').className = 'role-badge ' + 
                        (res.user.role === 'Super Admin' ? 'role-superadmin' : 'role-admin');

                    // If not Super Admin, disable Super Admin options
                    const isSuper = email === 'superadmin@marketplace.com';
                    document.getElementById('btn-save-admin-perms').disabled = !isSuper;
                    document.getElementById('admin-form').style.display = isSuper ? 'flex' : 'none';

                    loadState();
                }
            } catch (error) {
                showToast('Authentication failed.', true);
            }
        }

        function switchTab(tabId) {
            currentTab = tabId;
            document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
            document.getElementById(`nav-${tabId}`).classList.add('active');

            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${tabId}`).classList.add('active');

            const titles = {
                overview: 'Platform Overview',
                shops: 'Shop Directory Management',
                plans: 'Subscription Plans & Quotas',
                admins: 'Manage Admin Accounts',
                logs: 'SaaS Platform Audit Trail'
            };
            document.getElementById('current-tab-title').innerText = titles[tabId];

            loadTabContent(tabId);
        }

        function loadTabContent(tabId) {
            if (tabId === 'overview') {
                loadOverviewContent();
            } else if (tabId === 'shops') {
                loadShopsContent();
            } else if (tabId === 'plans') {
                loadPlansContent();
            } else if (tabId === 'admins') {
                loadAdminsContent();
            } else if (tabId === 'logs') {
                loadLogsContent();
            }
        }

        async function loadState() {
            try {
                const response = await fetch('/api/v1/platform/state', {
                    headers: { 'Authorization': 'Bearer ' + currentUserEmail }
                });
                if (response.status === 403) {
                    showToast('403 Forbidden: You do not have permissions.', true);
                    return;
                }
                const res = await response.json();
                if (res.success) {
                    renderStats(res.stats);
                    loadTabContent(currentTab);
                }
            } catch (e) {
                console.error(e);
            }
        }

        function renderStats(stats) {
            const grid = document.getElementById('overview-stats');
            grid.innerHTML = `
                <div class="stat-card">
                    <span class="stat-title">Total Shops</span>
                    <span class="stat-value">${stats.total_shops}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Active Shops</span>
                    <span class="stat-value" style="color: var(--color-success);">${stats.active_shops}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Suspended Shops</span>
                    <span class="stat-value" style="color: var(--color-danger);">${stats.suspended_shops}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Active Admins</span>
                    <span class="stat-value">${stats.total_admins}</span>
                </div>
            `;
        }

        async function loadOverviewContent() {
            try {
                const response = await fetch('/api/v1/platform/logs', {
                    headers: { 'Authorization': 'Bearer ' + currentUserEmail }
                });
                if (response.status === 403) {
                    document.getElementById('overview-logs-tbody').innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--color-danger);">403 Unauthorized to view platform system logs.</td></tr>';
                    return;
                }
                const res = await response.json();
                if (res.success) {
                    const tbody = document.getElementById('overview-logs-tbody');
                    tbody.innerHTML = '';
                    res.data.slice(0, 5).forEach(log => {
                        const tr = document.createElement('tr');
                        const time = new Date(log.created_at).toLocaleString();
                        tr.innerHTML = `
                            <td><strong style="color: var(--color-accent);">${log.action}</strong></td>
                            <td>${log.description}</td>
                            <td><code>${log.ip_address || '-'}</code></td>
                            <td>${time}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            } catch (e) {}
        }

        async function loadShopsContent() {
            try {
                const response = await fetch('/api/v1/platform/shops', {
                    headers: { 'Authorization': 'Bearer ' + currentUserEmail }
                });
                if (response.status === 403) {
                    document.getElementById('shops-tbody').innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-danger);">403 Unauthorized: Admin lacks explicit assignment for admin.shops</td></tr>';
                    return;
                }
                const res = await response.json();
                if (res.success) {
                    const tbody = document.getElementById('shops-tbody');
                    tbody.innerHTML = '';
                    res.data.forEach(shop => {
                        const tr = document.createElement('tr');
                        const isSuspended = shop.status === 'suspended';
                        const planName = shop.active_subscription && shop.active_subscription.plan 
                            ? shop.active_subscription.plan.name 
                            : 'No Active Plan';
                        
                        let actionButton = '';
                        if (shop.status === 'pending') {
                            actionButton = `
                                <button class="btn-action btn-success" style="background: var(--color-success);" onclick="approveShop('${shop.id}')">
                                    Approve
                                </button>
                            `;
                        } else {
                            actionButton = `
                                <button class="btn-action ${isSuspended ? 'btn-success' : 'btn-danger'}" onclick="toggleShopSuspension('${shop.id}')">
                                    ${isSuspended ? 'Activate' : 'Suspend'}
                                </button>
                            `;
                        }

                        tr.innerHTML = `
                            <td><strong>${shop.name}</strong></td>
                            <td><code>${shop.slug}</code></td>
                            <td>${shop.owner ? shop.owner.name : 'Unknown'} (${shop.owner ? shop.owner.email : '-'})</td>
                            <td><span class="role-badge" style="background: rgba(99,102,241,0.15); color: var(--color-accent); border: 1px solid var(--border-glow);">${planName}</span></td>
                            <td><span class="status-badge status-${shop.status}">${shop.status}</span></td>
                            <td>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    ${actionButton}
                                    <button class="btn-action" style="background: var(--color-accent);" onclick="openEditShopModal('${shop.id}', '${shop.name.replace(/'/g, "\\'")}', '${shop.slug}', '${(shop.domain || '').replace(/'/g, "\\'")}')">
                                        Edit
                                    </button>
                                </div>
                            </td>
                        `;
                        tbody.appendChild(tr);

                    });
                }
            } catch (e) {}
        }

        async function approveShop(shopId) {
            try {
                const response = await fetch(`/api/v1/platform/shops/${shopId}/approve`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': token,
                        'Authorization': 'Bearer ' + currentUserEmail
                    }
                });
                const res = await response.json();
                if (res.success) {
                    showToast(res.message || 'Shop approved successfully');
                    loadState();
                } else {
                    showToast(res.message, true);
                }
            } catch (e) {
                showToast('Failed to approve shop.', true);
            }
        }

        async function toggleShopSuspension(shopId) {
            try {
                const response = await fetch(`/api/v1/platform/shops/${shopId}/toggle-suspension`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': token,
                        'Authorization': 'Bearer ' + currentUserEmail
                    }
                });
                const res = await response.json();
                if (res.success) {
                    showToast(`Shop status updated to ${res.status}`);
                    loadState();
                } else {
                    showToast(res.message, true);
                }
            } catch (e) {
                showToast('Failed to change shop status.', true);
            }
        }

        async function loadPlansContent() {
            try {
                const response = await fetch('/api/v1/platform/plans', {
                    headers: { 'Authorization': 'Bearer ' + currentUserEmail }
                });
                if (response.status === 403) {
                    document.getElementById('plans-tbody').innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--color-danger);">403 Unauthorized: Admin lacks explicit assignment for admin.plans</td></tr>';
                    document.getElementById('plan-form').style.display = 'none';
                    return;
                }
                
                // Show form only if permitted and Super Admin is active
                const isSuper = currentUserEmail === 'superadmin@marketplace.com';
                document.getElementById('plan-form').style.display = isSuper ? 'flex' : 'none';

                const res = await response.json();
                if (res.success) {
                    const tbody = document.getElementById('plans-tbody');
                    tbody.innerHTML = '';
                    res.data.forEach(plan => {
                        const tr = document.createElement('tr');
                        const limits = typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits;
                        tr.innerHTML = `
                            <td><strong>${plan.name}</strong></td>
                            <td><strong style="color: var(--color-success);">$${parseFloat(plan.price).toFixed(2)} / mo</strong></td>
                            <td>
                                📦 Max Products: <strong>${limits.max_products}</strong><br>
                                🖼️ Max Images: <strong>${limits.max_images_per_product}</strong><br>
                                👥 Employees Limit: <strong>${limits.max_employees}</strong>
                            </td>
                            <td>
                                ${isSuper ? `<button class="btn-action" onclick='editPlan(${JSON.stringify(plan)})'>Edit Limits</button>` : '<em>Read-only</em>'}
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            } catch (e) {}
        }

        function editPlan(plan) {
            document.getElementById('plan-id').value = plan.id;
            document.getElementById('plan-name').value = plan.name;
            document.getElementById('plan-price').value = plan.price;
            const limits = typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits;
            document.getElementById('limit-products').value = limits.max_products;
            document.getElementById('limit-images').value = limits.max_images_per_product;
            document.getElementById('limit-employees').value = limits.max_employees;

            document.getElementById('plan-form-title').innerText = `Edit Plan: ${plan.name}`;
        }

        function resetPlanForm() {
            document.getElementById('plan-id').value = '';
            document.getElementById('plan-name').value = '';
            document.getElementById('plan-price').value = '';
            document.getElementById('limit-products').value = '';
            document.getElementById('limit-images').value = '';
            document.getElementById('limit-employees').value = '';
            document.getElementById('plan-form-title').innerText = 'Create New Subscription Plan';
        }

        async function savePlan(e) {
            e.preventDefault();
            const planId = document.getElementById('plan-id').value;
            const url = planId ? `/api/v1/platform/plans/${planId}` : '/api/v1/platform/plans';
            const method = planId ? 'PUT' : 'POST';

            const payload = {
                name: document.getElementById('plan-name').value,
                price: parseFloat(document.getElementById('plan-price').value),
                limits: {
                    max_products: parseInt(document.getElementById('limit-products').value),
                    max_images_per_product: parseInt(document.getElementById('limit-images').value),
                    max_employees: parseInt(document.getElementById('limit-employees').value),
                }
            };

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'Authorization': 'Bearer ' + currentUserEmail
                    },
                    body: JSON.stringify(payload)
                });
                const res = await response.json();
                if (res.success) {
                    showToast(res.message);
                    resetPlanForm();
                    loadState();
                } else {
                    showToast(res.message, true);
                }
            } catch (error) {
                showToast('Failed to save subscription plan.', true);
            }
        }

        async function loadAdminsContent() {
            try {
                const response = await fetch('/api/v1/platform/admins', {
                    headers: { 'Authorization': 'Bearer ' + currentUserEmail }
                });
                if (response.status === 403) {
                    document.getElementById('admins-tbody').innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--color-danger);">403 Unauthorized: Admin lacks explicit assignment for admin.admins</td></tr>';
                    document.getElementById('admin-form').style.display = 'none';
                    document.getElementById('admin-permissions-section').style.display = 'none';
                    return;
                }

                const isSuper = currentUserEmail === 'superadmin@marketplace.com';
                document.getElementById('admin-form').style.display = isSuper ? 'flex' : 'none';
                document.getElementById('admin-permissions-section').style.display = isSuper ? 'flex' : 'none';

                const res = await response.json();
                if (res.success) {
                    const tbody = document.getElementById('admins-tbody');
                    tbody.innerHTML = '';
                    
                    const selector = document.getElementById('admin-user-selector');
                    selector.innerHTML = '<option value="">-- Choose Admin Account --</option>';

                    res.data.forEach(admin => {
                        const tr = document.createElement('tr');
                        const isSuperAdmin = admin.email === 'superadmin@marketplace.com';
                        tr.innerHTML = `
                            <td><strong>${admin.name}</strong></td>
                            <td><code>${admin.email}</code></td>
                            <td><span class="role-badge ${isSuperAdmin ? 'role-superadmin' : 'role-admin'}">${isSuperAdmin ? 'Super' : 'Standard'}</span></td>
                            <td>
                                ${isSuper && !isSuperAdmin ? `<button class="btn-action" onclick="selectAdminForPermissions('${admin.id}', '${admin.email}')">Edit Perms</button>` : '<em>No action</em>'}
                            </td>
                        `;
                        tbody.appendChild(tr);

                        if (!isSuperAdmin) {
                            const opt = document.createElement('option');
                            opt.value = admin.id;
                            opt.innerText = admin.name + ' (' + admin.email + ')';
                            selector.appendChild(opt);
                        }
                    });

                    // Render Platform checkbox tree template
                    renderPlatformAdminPermissionsTree();
                }
            } catch (e) {}
        }

        function selectAdminForPermissions(id, email) {
            document.getElementById('admin-user-selector').value = id;
            loadAdminUserPermissions(id);
        }

        async function loadAdminUserPermissions(userId) {
            if (!userId) {
                resetAdminCheckboxes();
                return;
            }
            try {
                // Fetch the list of admins to check their current permissions list
                const response = await fetch('/api/v1/platform/admins', {
                    headers: { 'Authorization': 'Bearer ' + currentUserEmail }
                });
                const res = await response.json();
                if (res.success) {
                    const adminUser = res.data.find(u => u.id === userId);
                    if (adminUser) {
                        const activePerms = adminUser.admin_permissions || [];
                        
                        // Check nodes in the checklist
                        document.querySelectorAll('input[name="admin_permissions[]"]').forEach(cb => {
                            cb.checked = activePerms.includes(cb.value);
                        });
                        updateAdminParentCheckboxes();
                    }
                }
            } catch (e) {}
        }

        function resetAdminCheckboxes() {
            document.querySelectorAll('input[name="admin_permissions[]"]').forEach(cb => {
                cb.checked = false;
            });
            updateAdminParentCheckboxes();
        }

        function renderPlatformAdminPermissionsTree() {
            const container = document.getElementById('admin-tree-container');
            container.innerHTML = '';

            const config = platformPermissionsConfig;
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
                    const pageItem = document.createElement('div');
                    pageItem.className = 'tree-page-item';
                    pageItem.innerHTML = `
                        <input type="checkbox" name="admin_permissions[]" value="${pageKey}" id="admin-page-${pageKey}" onchange="updateAdminParentCheckboxes()" data-sub="${subKey}">
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

        async function createAdminAccount(e) {
            e.preventDefault();
            const payload = {
                name: document.getElementById('admin-name').value,
                email: document.getElementById('admin-email').value,
                password: document.getElementById('admin-password').value
            };

            try {
                const response = await fetch('/api/v1/platform/admins', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'Authorization': 'Bearer ' + currentUserEmail
                    },
                    body: JSON.stringify(payload)
                });
                const res = await response.json();
                if (res.success) {
                    showToast(res.message);
                    document.getElementById('admin-name').value = '';
                    document.getElementById('admin-email').value = '';
                    document.getElementById('admin-password').value = '';
                    loadState();
                } else {
                    showToast(res.message, true);
                }
            } catch (error) {
                showToast('Failed to create admin account.', true);
            }
        }

        async function saveAdminPermissions() {
            const adminUserId = document.getElementById('admin-user-selector').value;
            if (!adminUserId) {
                showToast('Please select an admin account to update.', true);
                return;
            }

            const checkedBoxes = document.querySelectorAll('input[name="admin_permissions[]"]:checked');
            const pages = Array.from(checkedBoxes).map(cb => cb.value);

            try {
                const response = await fetch(`/api/v1/platform/admins/${adminUserId}/permissions`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'Authorization': 'Bearer ' + currentUserEmail
                    },
                    body: JSON.stringify({ pages: pages })
                });
                const res = await response.json();
                if (res.success) {
                    showToast(res.message);
                    loadState();
                } else {
                    showToast(res.message, true);
                }
            } catch (error) {
                showToast('Failed to update platform admin permissions.', true);
            }
        }

        async function loadLogsContent() {
            try {
                const response = await fetch('/api/v1/platform/logs', {
                    headers: { 'Authorization': 'Bearer ' + currentUserEmail }
                });
                if (response.status === 403) {
                    document.getElementById('logs-tbody').innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-danger);">403 Unauthorized: Admin lacks explicit assignment for admin.logs</td></tr>';
                    return;
                }
                const res = await response.json();
                if (res.success) {
                    const tbody = document.getElementById('logs-tbody');
                    tbody.innerHTML = '';
                    res.data.forEach(log => {
                        const tr = document.createElement('tr');
                        const time = new Date(log.created_at).toLocaleString();
                        tr.innerHTML = `
                            <td><strong style="color: var(--color-accent);">${log.action}</strong></td>
                            <td>${log.description}</td>
                            <td>${log.user_id ? 'User: ' + log.user_id : 'Platform/System'}</td>
                            <td><code>${log.ip_address}</code></td>
                            <td><span class="role-badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary); border: 1px solid var(--border-light);">${log.device_type}</span></td>
                            <td>${time}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            } catch (e) {}
        }

        function openEditShopModal(id, name, slug, domain) {
            document.getElementById('edit-shop-id').value = id;
            document.getElementById('edit-shop-name').value = name;
            document.getElementById('edit-shop-slug').value = slug;
            document.getElementById('edit-shop-domain').value = domain;
            
            document.getElementById('modal-overlay').style.display = 'block';
            document.getElementById('edit-shop-modal').style.display = 'flex';
        }

        function closeEditShopModal() {
            document.getElementById('modal-overlay').style.display = 'none';
            document.getElementById('edit-shop-modal').style.display = 'none';
        }

        async function saveShopEdit(e) {
            e.preventDefault();
            const shopId = document.getElementById('edit-shop-id').value;
            const name = document.getElementById('edit-shop-name').value;
            const slug = document.getElementById('edit-shop-slug').value;
            const domain = document.getElementById('edit-shop-domain').value;

            try {
                const response = await fetch(`/api/v1/platform/shops/${shopId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'Authorization': 'Bearer ' + currentUserEmail
                    },
                    body: JSON.stringify({ name, slug, domain })
                });
                const res = await response.json();
                if (res.success) {
                    showToast(res.message || 'Shop updated successfully!');
                    closeEditShopModal();
                    loadState();
                } else {
                    showToast(res.message || 'Update failed.', true);
                }
            } catch (err) {
                showToast('Failed to update shop details.', true);
            }
        }
    </script>

    <!-- Modal Overlay -->
    <div id="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.65); z-index: 1500; display: none;" onclick="closeEditShopModal()"></div>

    <!-- Edit Shop Modal -->
    <div id="edit-shop-modal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--bg-surface); backdrop-filter: blur(15px); border: 1px solid var(--color-accent); border-radius: 16px; width: 100%; max-width: 440px; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.6); display: none; flex-direction: column; gap: 1.25rem; z-index: 2000;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem;">
            <h3 style="font-size: 1.2rem; font-weight: 600; color: #fff;">Modify Merchant Settings</h3>
            <button onclick="closeEditShopModal()" style="background: transparent; border: none; color: var(--text-secondary); font-size: 1.2rem; cursor: pointer;">✕</button>
        </div>
        <form onsubmit="saveShopEdit(event)" style="display: flex; flex-direction: column; gap: 1rem;">
            <input type="hidden" id="edit-shop-id">
            <div class="form-group">
                <label for="edit-shop-name" style="margin-bottom: 0.25rem; font-size: 0.85rem; color: var(--text-secondary);">Shop Name</label>
                <input type="text" id="edit-shop-name" required placeholder="e.g. Shop Alpha" style="width: 100%; background: var(--bg-card); border: 1px solid var(--border-light); color: #fff; padding: 0.75rem; border-radius: 8px; outline: none;">
            </div>
            <div class="form-group">
                <label for="edit-shop-slug" style="margin-bottom: 0.25rem; font-size: 0.85rem; color: var(--text-secondary);">Subdomain / Base URL Path (Slug)</label>
                <input type="text" id="edit-shop-slug" required placeholder="e.g. alpha" pattern="[a-zA-Z0-9\-_]+" style="width: 100%; background: var(--bg-card); border: 1px solid var(--border-light); color: #fff; padding: 0.75rem; border-radius: 8px; outline: none;">
                <small style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; display: block;">Only alphanumeric characters, dashes, and underscores allowed.</small>
            </div>
            <div class="form-group">
                <label for="edit-shop-domain" style="margin-bottom: 0.25rem; font-size: 0.85rem; color: var(--text-secondary);">Custom Domain (Optional)</label>
                <input type="text" id="edit-shop-domain" placeholder="e.g. alpha.globalshop.test" style="width: 100%; background: var(--bg-card); border: 1px solid var(--border-light); color: #fff; padding: 0.75rem; border-radius: 8px; outline: none;">
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 0.5rem; justify-content: flex-end;">
                <button type="button" class="btn-logout" onclick="closeEditShopModal()" style="background: transparent; border: 1px solid var(--border-light); color: var(--text-secondary); padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer;">Cancel</button>
                <button type="submit" class="btn-action" style="padding: 0.6rem 1.2rem;">Update Shop</button>
            </div>
        </form>
    </div>
</body>
</html>

