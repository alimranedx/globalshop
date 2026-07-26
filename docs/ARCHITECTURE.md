# GlobalShop — Project Architecture & Developer Guide

> **Last Updated:** 2026-07-26  
> **Branch:** `dev`  
> **Stack:** Laravel 11 + React 18 + Vite + MySQL

---

## 📐 Overview

GlobalShop is a **multi-panel SaaS marketplace** built on a single Laravel backend.  
It exposes three completely independent application panels:

| Panel | Base URL | Audience |
|---|---|---|
| **Public Marketplace** | `/` | Guest visitors, registered customers |
| **Shop Management** | `/shop/*` | Shop owners, shop employees |
| **Admin Console** | `/admin/*` | Platform Super Admin, Platform Admins |

Each panel has its **own React SPA entry point, Blade view, authentication flow, and UI design**.  
They share the same Laravel backend, database, middleware, and business logic.

---

## 🏗️ Architecture — Three Application Panels

### Application 1 — Public Marketplace

```
Blade:     resources/views/marketplace.blade.php
React:     resources/js/marketplace.jsx
Mount:     <div id="marketplace-root">
Routes:    / /login /register /profile/* /cart /checkout /buy-now
```

#### Public Marketplace Routes

| Route | Access | Description |
|---|---|---|
| `/` | Guest + Customer | Main marketplace — browse products & shops |
| `/login` | Guest only | Marketplace customer login (phone + password) |
| `/register` | Guest only | Marketplace customer registration |
| `/profile` | Authenticated customer | Customer profile dashboard |
| `/profile/orders` | Authenticated customer | My orders list |
| `/cart` | Guest + Customer | Shopping cart page |
| `/checkout` | Guest + Customer | Cart checkout flow |
| `/buy-now` | Guest + Customer | Direct Buy Now checkout |

---

### Application 2 — Shop Management

```
Blade:     resources/views/shop.blade.php
React:     resources/js/shop.jsx
Mount:     <div id="shop-owner-root">
Routes:    /shop/{slug}/* (protected by auth + shop.access middleware)
```

#### Shop Management Routes

| Route | Access | Description |
|---|---|---|
| `/shop` | Guest | Shop discovery / selection page |
| `/shop/{slug}` | Guest | Shop public entry + login page |
| `/shop/{slug}/login` | Guest | Shop-specific login (POST) |
| `/shop/{slug}/register` | Guest | Shop registration (POST) |
| `/shop/{slug}/dashboard` | Shop Owner/Employee | Shop management dashboard |
| `/shop/{slug}/catalog-hub/*` | Shop Owner/Employee | Products, categories, brands |
| `/shop/{slug}/sales/*` | Shop Owner/Employee | Sales & POS terminal |
| `/shop/{slug}/customers/*` | Shop Owner/Employee | Customer management |
| `/shop/{slug}/staff/*` | Shop Owner | Staff & roles management |
| `/shop/{slug}/settings/*` | Shop Owner | Shop settings & subscription |
| `/shop/{slug}/logs/*` | Shop Owner/Employee | Activity logs |
| `/shop/easy-login` | Local dev only | Developer 1-click login hub |

---

### Application 3 — Admin Console

```
Blade:     resources/views/admin.blade.php
React:     resources/js/admin.jsx → resources/js/admin/AdminApp.jsx
Mount:     <div id="admin-root">
Routes:    /admin/login (public) + /admin/* (protected)
```

#### Admin Panel Routes

| Route | Access | Description |
|---|---|---|
| `/admin/login` | Guest (public) | Admin login page |
| `/admin` | Platform Admin only | Dashboard — platform overview stats |
| `/admin/shops` | Platform Admin | Shop directory management |
| `/admin/plans` | Platform Admin | Subscription plan quotas |
| `/admin/admins` | Platform Admin | Admin accounts + permission matrix |
| `/admin/logs` | Platform Admin | Platform-wide audit trail |

---

## 🔑 Authentication Architecture

### Three Separate Authentication Contexts

```
MARKETPLACE CUSTOMER AUTH          SHOP EMPLOYEE AUTH             ADMIN AUTH
─────────────────────────          ──────────────────             ──────────
POST /api/v1/marketplace/login     POST /shop/{slug}/login        POST /api/v1/auth/login
POST /api/v1/marketplace/register  POST /shop/{slug}/register     GET  /api/v1/auth/me
GET  /api/v1/marketplace/me        Session: mock_active_tenant_id Session: Laravel Auth
Session: marketplace_customer_id   Auth: Standard Laravel         Auth: Standard Laravel
User model: MarketplaceCustomer    User model: User               User model: User
```

### Marketplace Customer Authentication

- Uses a **separate `MarketplaceCustomer` model** (phone-based, OTP-capable)
- Session key: `marketplace_customer_id`
- Routes prefixed: `/api/v1/marketplace/*`
- Login fields: **phone number** + password (or OTP)

### Shop Employee Authentication

- Uses the standard **`User` model** scoped to a tenant shop
- Session: `mock_active_tenant_id` stores the active shop ID
- Middleware chain: `auth` → `shop.access` → `page.authorize`
- Shop employees are linked via `shop_user` pivot table with an assigned `Role`

### Admin Authentication

- Uses the standard **`User` model** where `is_platform_admin = true`
- Two types: **Super Admin** (hardcoded email check) and **Platform Admin** (explicit permissions)
- API endpoint: `POST /api/v1/auth/login` + `GET /api/v1/auth/me`
- Admin SPA checks auth status on every page load via `/api/v1/auth/me`

---

## 🚧 Application Boundary Rules

These rules are enforced at the Laravel route/controller level:

| Actor | Visits | Expected Behavior |
|---|---|---|
| Guest | `/` | Public Marketplace |
| Guest | `/admin` | → Redirect to `/admin/login` |
| Guest | `/admin/login` | Admin Login page ✅ |
| Guest | `/login` | Marketplace Login page |
| Marketplace Customer | `/` | Public Marketplace |
| Marketplace Customer | `/admin` | → Redirect to `/admin/login` |
| Marketplace Customer | `/login` | → Redirect to `/` (already logged in) |
| Shop Owner/Employee | `/` | → Logout, redirect to `/login` |
| Shop Owner/Employee | `/login` | → Logout, redirect to `/login` as guest |
| Shop Owner/Employee | `/admin` | → Redirect to `/admin/login` (no admin access) |
| Platform Admin | `/admin` | Admin Dashboard ✅ |
| Platform Admin | `/admin/login` | → Redirect to `/admin` (already authenticated) |
| Platform Admin | `/` | → Logout, redirect to `/login` |

> **Rule:** A Shop/Admin user visiting `/` or `/login` gets their session forcefully cleared.  
> **Rule:** Marketplace customer sessions do NOT carry over to Admin panel.  
> **Rule:** Admin routes NEVER fall through to the Marketplace SPA.

---

## 👥 User Types, Roles & Permissions

### User Types (the `users` table)

| Field | Values | Meaning |
|---|---|---|
| `is_platform_admin` | `true` / `false` | Platform administrator flag |
| `admin_permissions` | JSON array of page keys | Explicit page grants for non-Super admins |
| `email` | `superadmin@marketplace.com` | Hardcoded Super Admin check |

### Platform Admin Types

| Type | Check | Access |
|---|---|---|
| **Super Admin** | `email === 'superadmin@marketplace.com'` | All platform pages (bypass) |
| **Platform Admin** | `is_platform_admin = true` + explicit `admin_permissions` array | Only explicitly granted pages |

### Shop Role Hierarchy

```
Shop Owner
  └── Can manage all shop features, staff, settings, subscriptions
      └── Manager Role (configurable permissions)
          └── Worker Role (configurable permissions)
                └── Permissions are page-level (Module → SubModule → Page)
```

### Permission Architecture

```
Module (e.g., "Products Management")
    └── SubModule (e.g., "Product Catalog")
            └── Page (e.g., "products.index", "products.create", "products.edit")
```

Page-level permissions are stored in `config/permissions.php` and enforced by `AuthorizePageAccess` middleware.

---

## 🛒 Marketplace Customer Features

### Customer Dashboard (`/profile`)

- Overview with account summary
- My Orders (all orders)
- Pending / Completed / Cancelled order filters
- Profile settings (name, phone, address)

### Cart Flow

1. Customer clicks **Add to Cart** on any product
2. Item is silently added — **no modal opens**
3. A floating toast notification appears: `"[Product Name] added to cart"`
4. Cart icon in header updates item count immediately
5. Customer clicks Cart icon → navigates to `/cart`
6. Cart page allows quantity changes and removal
7. Cart checkout → Place Order → **Order Success Page** with Download Receipt button

### Buy Now / Direct Checkout Flow

1. Customer clicks **Buy Now** on any product
2. Direct Checkout modal opens (does NOT add to cart)
3. Customer selects quantity (respects stock limit)
4. Total is calculated in real-time
5. Customer fills shipping info
6. Clicks **Place Order** → Order created
7. **Order Success Page** shown with receipt download option
8. Order appears in `/profile/orders` → My Orders

### Order Receipt

- Professional PDF format
- GlobalShop branding
- Customer name, phone, shipping info
- Order number, date, status, payment status
- Itemized product list with prices
- Order total
- Downloadable immediately after order placement
- Re-downloadable from Order Details page
- Access-controlled: customers can only download their own receipts

---

## 🛡️ Admin Console Structure

### Admin Panel Components

| Component | File | Purpose |
|---|---|---|
| Entry Point | `resources/js/admin.jsx` | Vite entry — mounts `AdminApp` |
| Root App | `resources/js/admin/AdminApp.jsx` | React Router + Auth context + all pages |
| Login Page | Inline in `AdminApp.jsx` | Dedicated admin login UI |
| Dashboard | Inline in `AdminApp.jsx` | Platform overview stats + recent logs |
| Shops Page | Inline in `AdminApp.jsx` | Shop directory, approve/suspend/edit |
| Plans Page | Inline in `AdminApp.jsx` | Subscription plan management |
| Admins Page | Inline in `AdminApp.jsx` | Admin accounts + permission matrix |
| Logs Page | Inline in `AdminApp.jsx` | Platform-wide audit trail |

### Admin API Endpoints

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/auth/me` | Any authenticated | Current user profile |
| GET | `/api/v1/platform/state` | Platform Admin | Platform overview stats |
| GET | `/api/v1/platform/shops` | `admin.shops` | List all shops |
| POST | `/api/v1/platform/shops/{shop}/approve` | `admin.shops` | Approve pending shop |
| POST | `/api/v1/platform/shops/{shop}/toggle-suspension` | `admin.shops` | Suspend/activate shop |
| PUT | `/api/v1/platform/shops/{shop}` | `admin.shops` | Edit shop details |
| GET | `/api/v1/platform/plans` | `admin.plans` | List subscription plans |
| POST | `/api/v1/platform/plans` | `admin.plans` | Create plan |
| PUT | `/api/v1/platform/plans/{plan}` | `admin.plans` | Update plan |
| GET | `/api/v1/platform/admins` | `admin.admins` | List admin accounts |
| POST | `/api/v1/platform/admins` | `admin.admins` | Create admin account |
| PUT | `/api/v1/platform/admins/{user}/permissions` | Super Admin only | Update admin permissions |
| GET | `/api/v1/platform/logs` | `admin.logs` | Platform audit logs |

---

## 🏪 Shop Management Structure

### Shop Management API Endpoints

Prefix: `/api/v1/tenant/*` (requires `shop.access` + `auth` + `page.authorize`)

| Resource | Routes | Permission |
|---|---|---|
| Products | CRUD | `products.index`, `products.create`, `products.edit`, `products.destroy` |
| Categories | CRUD | `categories.index` |
| Brands | CRUD | `brands.index` |
| Roles | CRUD + Permissions | `roles.index` (via `employees.index`) |
| Employees | CRUD | `employees.index` |
| Sales/POS | List + Create | `sales.index`, `sales.create` |
| Refunds | List + Create + Approve | `refunds.index` |
| Customers | List + Edit + Credit | `customers.index`, `customers.edit` |
| Settings | Update | `settings.general` |
| Dashboard | Stats | Any authenticated shop user |

---

## 🔐 Default Credentials (Development)

> All test accounts use password: **`password`**

### Platform Admins

| Role | Email | Password | Notes |
|---|---|---|---|
| Super Admin | `superadmin@marketplace.com` | `password` | Full unrestricted root access |
| Platform Admin | `grace@marketplace.com` | `password` | Explicit page permissions required |

### Shop Alpha (`/shop/alpha/*`)

| Role | Email | Password | Permissions |
|---|---|---|---|
| Shop Owner | `john@alpha.com` | `password` | Full shop access |
| Manager | `bob@alpha.com` | `password` | Products, Staff, Sales |
| Sales Manager | `sam@alpha.com` | `password` | `sales.create` (POS Terminal) |
| Worker | `charlie@alpha.com` | `password` | `products.index` (view-only) |

### Marketplace Customer

| Role | Email/Phone | Password |
|---|---|---|
| Customer | `alice@customer.com` | `password` |

---

## 🧪 Development Setup

### Requirements

- PHP 8.2+
- Node.js 18+
- MySQL 8
- Composer

### Installation

```bash
git clone <repo>
cd globalshop
composer install
npm install
cp .env.example .env
php artisan key:generate

# Configure database in .env, then:
php artisan migrate

# Seed test data (reset + seed in one step via demo route):
curl -X POST http://localhost:8000/demo/reset
```

### Running Locally

```bash
composer run dev    # Starts both Laravel artisan serve + Vite dev server
```

Or separately:

```bash
php artisan serve        # Laravel at :8000
npm run dev              # Vite HMR at :5173
```

### Building Production Assets

```bash
npm run build
```

---

## 🧪 Testing Instructions

### Backend Tests

```bash
./vendor/bin/phpunit
```

**Expected:** 59 tests, 59 passed, 273 assertions

### Manual Test Checklist

#### Admin Panel

| Test | Expected |
|---|---|
| Visit `http://localhost:8000/admin` (no session) | Redirect to `/admin/login` |
| Visit `http://localhost:8000/admin/login` | Admin Login page rendered |
| Login with `superadmin@marketplace.com` / `password` | Redirect to `/admin` dashboard |
| Admin Dashboard shows stats | Total Shops, Active, Plans, Admins, Logs visible |
| Sidebar navigation | Navigate between Dashboard, Shops, Plans, Admins, Logs |
| Shop approve/suspend | Toggle shop status and verify |
| Create subscription plan | Form → save → appears in plan list |
| Admin permissions matrix | Super Admin can grant/revoke pages for Grace Admin |
| Logout | Redirects to `/admin/login` |
| Visit `/admin` after logout | Redirects to `/admin/login` |

#### Public Marketplace

| Test | Expected |
|---|---|
| Visit `http://localhost:8000/` | Marketplace product listing |
| Visit `http://localhost:8000/login` | Marketplace login page |
| Login with Alice Customer | Redirect to `/` |
| Add to Cart | Silent add, toast notification, counter updates |
| Cart page | Shows items, quantities, totals |
| Cart checkout | Creates order, shows success page with receipt download |
| Buy Now | Direct checkout, does NOT add to cart, creates order |
| Download Receipt | PDF downloaded with order details |
| My Orders | All orders listed, filterable by status |

#### Shop Management

| Test | Expected |
|---|---|
| Visit `/shop/easy-login` | Developer login hub |
| Login as John Owner | Redirected to `/shop/alpha/dashboard` |
| Shop Dashboard | Stats, sales chart visible |
| Shop Employee visiting `/` | Logout → redirect to `/login` |

---

## ⚠️ Important Development Rules

1. **Do NOT add `auth` middleware to `/admin/login`** — it must be publicly accessible without authentication.

2. **Do NOT redirect unauthenticated `/admin` to `/`** — always redirect to `/admin/login`.

3. **`/admin/login` must be defined BEFORE `/admin/{any?}`** in `routes/web.php` to prevent the wildcard from consuming the login route.

4. **Three separate React entry points** — never serve the Admin SPA from a Marketplace or Shop blade, and vice versa.

5. **`AuthorizePageAccess` middleware** — the `platform_admin` pages (prefixed `admin.`) bypass shop-level checks but enforce Super Admin vs explicit-permission distinction.

6. **Session boundary:** Marketplace customer sessions (`marketplace_customer_id`) are COMPLETELY separate from Laravel `Auth` sessions used by Shop Employees and Platform Admins.

7. **The `ApiTokenAuthenticate` middleware** on all API routes allows test header-based auth via `Authorization: Bearer <email>` in dev/test mode only. Do not rely on this in production.

8. **Super Admin is hardcoded** by email (`superadmin@marketplace.com`). Permission updates via `PUT /api/v1/platform/admins/{user}/permissions` are restricted to Super Admin only.

9. **Do NOT break the fallback route behavior** — `/admin/*` must NOT be caught by the marketplace SPA fallback.

---

## 📁 Key Files Reference

| File | Purpose |
|---|---|
| `routes/web.php` | All web (HTML) routes for all three panels |
| `routes/api.php` | All API endpoints |
| `bootstrap/app.php` | Middleware registration |
| `config/permissions.php` | Module/SubModule/Page permission tree |
| `app/Http/Controllers/PlatformAdminController.php` | Admin panel web + API controller |
| `app/Http/Controllers/AuthController.php` | Auth login/logout/me |
| `app/Http/Controllers/MarketplaceCustomerController.php` | Marketplace customer auth + orders + receipts |
| `app/Modules/Authorization/Middleware/AuthorizePageAccess.php` | Page-level authorization |
| `app/Modules/ShopManager/Middleware/EnsureShopAccess.php` | Shop tenant access control |
| `app/Modules/ShopManager/TenantManager.php` | Active shop (tenant) scope manager |
| `app/Models/User.php` | User model — includes `hasAdminPermission()` |
| `resources/js/marketplace.jsx` | Marketplace React SPA |
| `resources/js/shop.jsx` | Shop Management React SPA |
| `resources/js/admin.jsx` | Admin Panel Vite entry |
| `resources/js/admin/AdminApp.jsx` | Admin Panel React SPA (all components) |
| `resources/views/marketplace.blade.php` | Marketplace HTML shell |
| `resources/views/shop.blade.php` | Shop Management HTML shell |
| `resources/views/admin.blade.php` | Admin Console HTML shell |

---

## 📋 Feature Status

| Feature | Status |
|---|---|
| Public Marketplace — Product Browsing | ✅ Implemented |
| Public Marketplace — Shop Filtering | ✅ Implemented |
| Marketplace Customer Login/Register | ✅ Implemented |
| Add to Cart (silent, toast) | ✅ Implemented |
| Cart Page + Quantity Management | ✅ Implemented |
| Cart Checkout + Order Placement | ✅ Implemented |
| Buy Now / Direct Checkout | ✅ Implemented |
| Order Success Page | ✅ Implemented |
| Order Receipt PDF Download | ✅ Implemented |
| Customer Dashboard + My Orders | ✅ Implemented |
| Order Detail View | ✅ Implemented |
| Shop Management Dashboard | ✅ Implemented |
| Shop Product/Category/Brand CRUD | ✅ Implemented |
| Shop POS Terminal (Sales) | ✅ Implemented |
| Shop Refund Management | ✅ Implemented |
| Shop Employee/Role Management | ✅ Implemented |
| Shop Settings + Subscription | ✅ Implemented |
| Admin Login Page (`/admin/login`) | ✅ Implemented |
| Admin Dashboard (Platform Stats) | ✅ Implemented |
| Admin Shop Directory + Approve/Suspend | ✅ Implemented |
| Admin Subscription Plan Management | ✅ Implemented |
| Admin Account Management | ✅ Implemented |
| Admin Permission Matrix | ✅ Implemented |
| Admin Audit Trail Logs | ✅ Implemented |
| Application Boundary Enforcement | ✅ Implemented |
| Platform-wide User Management | 🔲 Planned |
| Platform-wide Revenue Reports | 🔲 Planned |
| Global System Settings | 🔲 Planned |
| OTP-based Marketplace Login | 🔲 Planned (infrastructure exists) |
