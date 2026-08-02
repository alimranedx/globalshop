# GlobalShop — Feature Decisions & Business Rules

This document tracks permanent business rules established for GlobalShop features.

---

## 📌 Feature Decisions Matrix

### 1. Multi-Tenant Shop Isolation
- **Rule:** A shop employee or owner from `Shop A` must **NEVER** view, edit, or delete resources belonging to `Shop B`.
- **Reason:** Data integrity, tenant security, and regulatory compliance.
- **Enforcement:** Enforced at middleware level via `EnsureShopAccess` and at model level via `TenantManager::getTenantId()`.

### 2. Marketplace vs Shop Auth Isolation
- **Rule:** Logging in as a Shop Owner or Admin automatically logs out any customer session on the public marketplace root `/` route.
- **Reason:** Prevents session collision and state leakage between marketplace customer context and shop management context.
- **Enforcement:** Enforced in `web.php` root route handler.

### 3. POS Terminal Inventory Deduction
- **Rule:** Every POS sale or online checkout automatically decrements `Product.stock_quantity` by the exact item quantity purchased.
- **Reason:** Real-time stock accuracy across marketplace and POS terminal.

### 4. Admin Console Access Control
- **Rule:** Only users with `is_platform_admin = true` can access `/admin/*` routes.
- **Reason:** Platform security and shop privacy.

### 5. Interactive Client-Side Image Editing (HTML5 Canvas Engine)
- **Rule:** All profile photo and product catalog image uploads must present an interactive 2D canvas editor modal allowing zoom, rotation, panning, and cropping before sending edited JPEG Blobs to the backend API.
- **Reason:** Prevents distorted avatars/product photos, optimizes storage sizes, and provides modern e-commerce visual standards.

### 6. Unauthenticated Guest & Logout Route Navigation
- **Rule:** Logging out or accessing protected shop panel routes while unauthenticated MUST update the browser location bar cleanly to `/shop/{slug}/login` without recursive 302 redirect loops.
- **Reason:** Eliminates browser URL mismatches (`ERR_TOO_MANY_REDIRECTS`), keeps history stack clean, and ensures consistent SPA entry points.
