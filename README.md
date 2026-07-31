# GlobalShop — Multi-Tenant SaaS E-Commerce Marketplace

[![Laravel Framework](https://img.shields.io/badge/Laravel-13.8-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)

**GlobalShop** is a modern, high-performance **multi-tenant SaaS e-commerce marketplace** powered by a single **Laravel 13** backend. It features **three distinct React 19 Single Page Application (SPA) panels** sharing business logic, database, and tenant isolation:

---

## 📚 Documentation & Setup Guides

* 🚀 **[Deployment & Setup Guide (DEPLOYMENT.md)](./DEPLOYMENT.md)** — Step-by-step local development setup (Windows + Laragon), production Linux (Ubuntu + Nginx + PHP 8.3-FPM) deployment guide, `.env` matrix, queue workers, and troubleshooting.
* 📐 **[System Architecture Guide (docs/ARCHITECTURE.md)](./docs/ARCHITECTURE.md)** — Detailed technical architecture, panel routing, blade entry points, and module structure.
* 🔑 **[Credentials & System URLs (docs/CREDENTIALS_AND_URLS.md)](./docs/CREDENTIALS_AND_URLS.md)** — Complete reference of default accounts, test credentials, role access, and verification workflows.

---

## 🔑 Default Test Credentials Reference

> [!NOTE]
> All pre-configured test accounts use the standard password: **`password`**

### 1. Platform Admin Accounts (`/admin/login`)

| Role | Name | Email | Password | Access Rights & Scope |
|---|---|---|---|---|
| **Super Admin** | Super Admin | `superadmin@marketplace.com` | `password` | Full system access, platform admin control, admin permission management. |
| **Platform Admin** | Grace Admin | `grace@marketplace.com` | `password` | Platform management access (Shops, Plans, System Audit Logs). |

### 2. Multi-Tenant Shop Accounts (`/shop/{slug}/login` or `/shop/easy-login`)

#### Shop Alpha (`/shop/alpha/dashboard`)

| Role | Name | Email | Password | Scope & Permissions |
|---|---|---|---|---|
| **Shop Owner** | John Owner | `john@alpha.com` | `password` | Full Shop Owner access (Products, Staff, POS Sales, Settings, Subscription). |
| **Shop Manager** | Bob Manager | `bob@alpha.com` | `password` | Managing products, categories, brands, staff, and sales terminal. |
| **Sales Manager** | Sam Sales | `sam@alpha.com` | `password` | Products catalog view & POS Sales Terminal execution (`sales.create`). |
| **Shop Worker** | Charlie Worker | `charlie@alpha.com` | `password` | View-only product catalog access (`products.index`). |

#### Additional Tenant Shops

| Shop Name | Tenant Slug | Owner Name | Owner Email | Password | Target Dashboard URL |
|---|---|---|---|---|---|
| **Shop Beta** | `beta` | Betty Owner | `owner.b@beta.com` | `password` | `/shop/beta/dashboard` |
| **Shop Gamma** | `gamma` | George Owner | `owner.c@gamma.com` | `password` | `/shop/gamma/dashboard` |
| **Shop Delta** | `delta` | David Owner | `owner.d@delta.com` | `password` | `/shop/delta/dashboard` |

### 3. Marketplace Customer Accounts (`/login` or `/register`)

| Role | Name | Email / Phone | Password | Access Rights & Scope |
|---|---|---|---|---|
| **Customer** | Alice Customer | `alice@customer.com` <br> `01700000001` | `password` | Marketplace shopping, cart drawer, customer profile, order history. |
| **Customer** | Bob Customer | `bob@customer.com` <br> `01700000002` | `password` | Customer checkout & order tracking. |

> [!TIP]
> In local development, navigate to **`/shop/easy-login`** to access the 1-click single-click account switcher listing all test credentials and active tenant shops.

---

## 🏗️ Application Panels Overview

| Panel | Base URL Path | React Entry Point | Audience & Key Features |
|---|---|---|---|
| 🛒 **Public Marketplace** | `/` | `marketplace.jsx` | Browse products, category/shop filtering, shopping cart, customer checkout, orders. |
| 🏪 **Shop Management** | `/shop/{slug}/*` | `shop.jsx` | Multi-tenant shop dashboard, catalog hub (products, categories, brands), POS sales terminal, staff roles. |
| ⚙️ **Platform Admin** | `/admin/*` | `admin.jsx` | Super Admin & Platform Admin portal for shop approvals, subscription plans, admin permissions, and audit logs. |

---

## ⚡ Quick Start (Local Development)

### Prerequisites

* **PHP:** `^8.3` (with `bcmath`, `curl`, `gd`, `intl`, `mbstring`, `pdo_mysql`, `pdo_sqlite`, `sqlite3`, `zip`)
* **Node.js:** `^20.0` or `^24.0` LTS & **npm** `^10.0`
* **Composer:** `^2.8`
* **MySQL:** `^8.0` or MariaDB `10.4+`

### 1. Clone & Configure

```bash
git clone https://github.com/alimranedx/globalshop.git
cd globalshop
git checkout dev
copy .env.example .env
```

### 2. Install Dependencies & Setup App

```bash
composer install
php artisan key:generate
npm install
php artisan migrate
php artisan db:seed
php artisan storage:link
npm run build
```

### 3. Start Development Servers

Run all background services simultaneously:

```bash
composer run dev
```

Visit the application locally at:
* **Public Marketplace:** `http://localhost:8000/`
* **Developer Easy Login Hub:** `http://localhost:8000/shop/easy-login`
* **Shop Alpha Dashboard:** `http://localhost:8000/shop/alpha/dashboard`
* **Admin Login:** `http://localhost:8000/admin/login`

---

For complete setup, architecture, and deployment procedures, refer to **[DEPLOYMENT.md](./DEPLOYMENT.md)** and **[docs/CREDENTIALS_AND_URLS.md](./docs/CREDENTIALS_AND_URLS.md)**.
