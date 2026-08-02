# GlobalShop — Permanent Project Memory

This document contains permanent, durable knowledge regarding the **GlobalShop** SaaS e-commerce marketplace repository.

---

## 🏛️ Business & System Architecture

1. **Multi-Tenant Structure:**
   - Single Laravel 13 database hosting multiple shops (`Shop Alpha`, `Shop Beta`, `Shop Gamma`, `Shop Delta`).
   - Every shop has a unique URL slug (`/shop/{slug}`).
   - Shop status flags: `active`, `pending`, `suspended`, `draft`.

2. **User & Auth Guard Architecture:**
   - **Platform Admins & Shop Users:** Authenticate via standard Laravel `web` session guard on `users` table. Platform Admins have `is_platform_admin = true`.
   - **Marketplace Customers:** Authenticate via `MarketplaceCustomer` model (`marketplace_customers` table) with dedicated customer login (`/login`) using phone/email + password.

3. **Role & Permission Management:**
   - Custom shop-level roles (`Role` model) stored per shop (`shop_id`).
   - Standard roles: `Manager`, `Sales Manager`, `Worker`.
   - Pivot table `shop_user` links `User` to `Shop` with `role_id` and `status` (`active`, `pending`).
   - Dynamic permissions mapped via `RolePage` model (`role_id`, `page_name`).

4. **Product Catalog & Multi-Tenancy:**
   - `Category` and `Brand` models utilize global Eloquent scopes (`withoutGlobalScopes()`) for shop-level isolation.
   - `Product` belongs to `Shop`, `Category`, and `Brand`.
   - `ProductImage` stores image asset paths relative to `public/storage`.
   - `ProductImageEditorModal.jsx`: Interactive rectangular crop frame (1:1 / 4:3 format switcher, rule-of-thirds grid, zoom, rotation, panning, 600x600 JPEG canvas export) integrated into `ProductsPage.jsx`.

5. **User Profile & Avatar Management:**
   - `ProfileController` handles personal details updates (`GET/PUT /api/v1/profile`) and avatar photo uploads (`POST /api/v1/profile/avatar`).
   - Avatar photos stored in `public/storage/avatars/`.
   - `ProfileImageEditorModal.jsx`: Interactive circular avatar crop modal (zoom, rotate, pan, 400x400 JPEG export).

6. **Sales & POS Terminal System:**
   - `Sale` model records order transactions (POS terminal or online customer checkout).
   - Fields: `invoice_number`, `customer_name`, `customer_phone`, `payment_method` (`cash`, `card`), `subtotal`, `discount`, `total`, `paid_amount`, `change_amount`, `sale_type` (`pos`, `online`), `sale_date`.
   - `SaleItem` records line items (`product_id`, `product_name`, `price`, `quantity`, `total`).
   - Sales automatically decrement product `stock_quantity`.

7. **Subscription Quotas & Limits:**
   - `Plan` model defines quota limits (`max_products`, `max_images_per_product`, `max_employees`, `max_categories`, `max_brands`).
   - Cached via `TenantManager::getLimit($key)` with 1-hour cache tags.

8. **Support Ticket System:**
   - Public login trouble / support tickets (`SupportTicket` and `SupportTicketMessage`).
   - Managed by Platform Admins (`/admin/tickets`). Internal notes isolated from public customers.
