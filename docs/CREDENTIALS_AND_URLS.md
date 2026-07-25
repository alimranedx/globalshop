# GlobalShop - System URLs & Credentials Reference Guide

This document provides a comprehensive list of all application entry points, user roles, default credentials, and testing procedures for GlobalShop Marketplace & Multi-tenant Shop Management.

---

## 🌐 Application URLs

| Interface | URL Path | Description |
| :--- | :--- | :--- |
| **Public Marketplace** | `/shop` (or `/`) | Public e-commerce portal where customers browse products, search by name/category, filter by shop, and place orders. |
| **Easy Login Hub** | `/shop/easy-login` | Developer & QA single-click account switcher listing all test credentials and active shops. |
| **Shop Management SPA** | `/shop/{slug}/dashboard` | React-based Shop Management portal (Dashboard, Products, POS Terminal, Staff, Settings, Refunds). |
| **Platform Admin Panel** | `/admin` | Super Admin / Platform Admin portal for managing shops, approving pending registrations, subscription plans, and audit logs. |

---

## 🔑 Default Accounts & Credentials

All test accounts use the default password: **`password`**

### 1. Platform Admin Accounts

| Role | Name | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Super Admin | `superadmin@marketplace.com` | `password` | Full system access, platform admin control, admin permission management. |
| **Platform Admin** | Grace Admin | `grace@marketplace.com` | `password` | Platform management access (Shops, Plans, Logs). |

### 2. Shop Accounts (Shop Alpha - `/shop/alpha/dashboard`)

| Role | Name | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Shop Owner** | John Owner | `john@alpha.com` | `password` | Full Shop Owner access (Products, Staff, Sales, Settings, Subscriptions). |
| **Shop Manager** | Bob Manager | `bob@alpha.com` | `password` | Managing products, categories, brands, staff, and sales. |
| **Sales Manager** | Sam Sales | `sam@alpha.com` | `password` | Products catalog and POS Sales Terminal access (`sales.create`). |
| **Shop Worker** | Charlie Worker | `charlie@alpha.com` | `password` | View-only product access (`products.index`). |

### 3. Customer Account

| Role | Name | Email / Phone | Password | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Alice Customer | `alice@customer.com` | `password` | Marketplace shopping, cart drawer, OTP login, shop preference selection. |

---

## 🧪 Step-by-Step Testing & Verification Workflows

### Workflow 1: Easy Login & Role Switcher
1. Navigate to **`/shop/easy-login`**.
2. Click **"Log In as John Owner"** or any target role button.
3. You will be logged in and redirected straight to the Shop Management Dashboard.
4. To test logout, click the **"Logout"** icon in the sidebar or top navigation bar.

### Workflow 2: Employee POS Sale Execution
1. Log in as **`bob@alpha.com`** or **`sam@alpha.com`** via `/shop/easy-login` or `/shop/alpha/login`.
2. Click **"Sales / POS"** from the left navigation menu.
3. Search for a product (e.g. "ApexTech") and click to add to cart.
4. Adjust cart quantity or apply discount if desired.
5. Click **"Process Payment"**, select **Cash** or **Card**, and enter cash amount.
6. Click **"Complete Sale"**.
7. Confirm that stock updates automatically and an invoice/receipt modal is displayed.

### Workflow 3: Customer Product Search & Shop Filter
1. Open the Marketplace landing page at **`/shop`**.
2. Use the left sidebar to select **"Shop Alpha"** to filter products exclusively for that shop.
3. Use the top search bar to type a product name (e.g. "Laptop" or "Series A").
4. Click **"+ Cart"** or **"Buy Now"** to open the cart drawer.
5. Complete checkout by filling in recipient details and payment method.

### Workflow 4: Platform Admin Control
1. Log in as **`superadmin@marketplace.com`** via `/admin` or standard login.
2. View platform statistics (total active shops, suspended shops, revenue plans).
3. Toggle Shop Alpha status between **Active** and **Suspended**.
4. Manage subscription plans or view global activity logs.
