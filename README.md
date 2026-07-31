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

## 🔑 Default Test Credentials

All test accounts use the default password: **`password`**

* **Super Admin:** `superadmin@marketplace.com`
* **Platform Admin:** `grace@marketplace.com`
* **Shop Alpha Owner:** `john@alpha.com`
* **Shop Alpha Manager:** `bob@alpha.com`
* **Shop Alpha Sales POS:** `sam@alpha.com`
* **Customer Account:** `alice@customer.com`

For complete testing details, refer to **[docs/CREDENTIALS_AND_URLS.md](./docs/CREDENTIALS_AND_URLS.md)** and **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
