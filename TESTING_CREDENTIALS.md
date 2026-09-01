# 🔐 GlobalShop — Production & Sandbox Testing Credentials

This document provides a single reference for all test user accounts, credentials, panel URLs, and roles across the **GlobalShop Multi-Tenant SaaS Marketplace**.

---

## 🌐 Panel Access URL Directory

| Panel | Live / Production URL | Local Development URL | Primary Audience |
| :--- | :--- | :--- | :--- |
| **Public Marketplace** | [https://shopbusket.com/](https://shopbusket.com/) | `http://localhost:8000/` or `/marketplace` | Marketplace Shoppers & Customers |
| **Shop Discovery & Registration** | [https://shopbusket.com/shop](https://shopbusket.com/shop) | `http://localhost:8000/shop` | Merchant Discovery & Store Registration |
| **Shop Management Portal** | [https://shopbusket.com/shop/{slug}](https://shopbusket.com/shop/alpha) | `http://localhost:8000/shop/alpha` | Shop Owners & Staff (POS, Catalog, Staff) |
| **Platform Admin Console** | [https://shopbusket.com/admin/login](https://shopbusket.com/admin/login) | `http://localhost:8000/admin/login` | Platform Super Admins & Platform Admins |
| **Developer Easy Login Hub** | Local Dev Only | `http://localhost:8000/shop/easy-login` | 1-Click Role Switching (Local Environment) |

---

## 👥 User Accounts & Credentials Matrix

All default seeded test accounts use the universal password: **`password`**

### 1. Platform Administration (`/admin`)

| Name | Email Address | Password | Role & Permissions | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@marketplace.com` | `password` | **Super Administrator** (Full unrestricted access across all shops, approvals, plans, admins, logs) | Global Platform |
| **Grace Admin** | `grace@marketplace.com` | `password` | **Platform Admin** (Configurable admin permissions assigned by Super Admin) | Global Platform |

---

### 2. Shop Alpha (`/shop/alpha`) — Active Merchant Store

| Name | Email Address | Password | Role | Assigned Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **John Owner** | `john@alpha.com` | `password` | **Shop Owner** | Full unrestricted management of Shop Alpha (Catalog, Staff, POS, Settings, Plan Quotas) |
| **Bob Manager** | `bob@alpha.com` | `password` | **Manager** | Products, Categories, Brands, Staff, POS Sales Terminal, Settings, Reports |
| **Sam Sales** | `sam@alpha.com` | `password` | **Sales Manager** | POS Terminal, Sales History, Product Directory |
| **Charlie Worker** | `charlie@alpha.com` | `password` | **Worker** | Product Catalog View Only |

---

### 3. Marketplace Customer (`/` & `/marketplace`)

| Name | Email / Phone | Password | OTP (Demo) | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Alice Customer** | `alice@customer.com` / `+1234567890` | `password` | `123456` | Direct Buy Now, Multi-Shop Cart Checkout, Order History Tracking, PDF Receipt Invoices |

---

## ⚡ Quick Testing & Demo Database Reset

To reset the sandbox database to clean, pristine demo records at any time:

### Via API / Curl:
```bash
curl -X POST http://localhost:8000/demo/reset
```

### Reset Data Includes:
- **1 Super Admin & 1 Platform Admin**
- **1 Verified Shop Owner (`john@alpha.com`) with active Shop Alpha**
- **3 Shop Employees (Manager, Sales Manager, Worker)**
- **10 Categories, 20 Brands, 30 Products with multiple image galleries and stock**
- **1 Standard Trial Subscription Plan** (100 products quota)
- **1 Customer Account (`alice@customer.com`)**

---

## 🚀 Key Workflows for Testing

### Flow 1: Register New Shop & Platform Admin Approval
1. Navigate to `/shop` and click **"Register New Shop"**.
2. Fill in the Shop Name, Subdomain Slug (e.g. `my-fashion`), Owner Name, Email, and Password.
3. Submit the registration form. Notice the status is **`Pending Approval`**.
4. Log into the Platform Admin Console at `/admin/login` as `superadmin@marketplace.com` (`password`).
5. Open **Shop Directory**, filter by **`Pending`**, and click **`✅ Approve`**.
6. The shop status is immediately upgraded to **`Active`**.
7. The owner can now log in at `/shop/my-fashion/login` and invite staff in **Staff & Roles Hub**.

### Flow 2: Smart Single-Product "Buy Now" Direct Checkout
1. Visit `/` or `/marketplace`.
2. Click **`⚡ Buy Now`** on any product card or detail page.
3. Choose quantity, fill receiver name, phone, shipping address, and payment method.
4. Click **`Place Direct Order`**.
5. Instantly download the official PDF receipt invoice upon confirmation.

### Flow 3: Smart Multi-Item Cart Drawer Checkout
1. Add products from multiple shops into the cart using **`🛒 +Cart`**.
2. Open the Cart Drawer in the top right navbar.
3. Review items grouped by merchant, adjust quantities, and click **`Proceed to Checkout`**.
4. Enter delivery details and confirm the order.
5. Access past orders anytime in **Customer Dashboard** (`/profile/orders`).
