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

### 7. Shop Registration & Platform Admin Approval Workflow
- **Rule:** Public shop registrations from the Shop Discovery Hub (`/shop`) or API are created in `status = 'pending'`. Pending shops are hidden from the active public shop search and blocked from dashboard management until explicitly approved (`status = 'active'`) by a Platform Admin. Once approved, the Shop Owner can log in, configure the store, and invite/register employees.
- **Reason:** Platform vetting, spam prevention, and orderly merchant onboarding.
- **Enforcement:** Enforced in `RegisterShopAction`, `EnsureShopAccess` middleware, and `PlatformAdminController::approveShop`.

### 8. Strict Independent Catalog Scoping (Categories, Brands, Products)
- **Rule:** Categories, Brands, and Products are strictly independent per shop. Shop owners and managers have full control to add, edit, and delete their own categories and brands without seeing foreign or global read-only categories.
- **Reason:** Ensures merchant independence, clean catalog organization, and prevents cross-tenant catalog pollution.
- **Enforcement:** Enforced via `BelongsToTenant` trait on `Category`, `Brand`, and `Product` models, and verified in `ShopMultiTenantTest`.

### 9. Subdomain & Custom Domain Routing Architecture
- **Rule:** Every registered tenant shop operates on its own dedicated subdomain (`{subdomain}.shopbusket.com`) with the ability to map a verified custom brand domain (`www.mybrand.com`). Local testing fallbacks to `/store/{slug}` are supported. Legacy paths (`/shop/{slug}/*`) 301 redirect to canonical subdomains.
- **Reason:** Provides a white-label merchant experience while keeping centralized backend management.
- **Enforcement:** Enforced via `ResolveTenant` middleware, `Shop::resolveCustomDomainShop()`, `CustomDomainRoutingTest`, and `SubdomainShopRoutingTest`.

### 10. Multi-Theme Storefront Engine with Dynamic CSS Custom Properties
- **Rule:** Tenant shops can select from pre-registered themes (`default`, `grocery`, `boutique`, `tech`) in `config/themes.php`. Custom color palettes and announcements are injected via CSS custom properties and JSON configs into `storefront.blade.php`.
- **Reason:** Supports industry-specific visual layouts (Grocery supermarket, Tech specs, Luxury boutique) without requiring separate codebases or full CSS rebuilds.
- **Enforcement:** Handled via `ThemeService` and `ThemeController`.

### 11. Frictionless Silent Add-To-Cart & Live Selection Counter
- **Rule:** Clicking "Add to Cart" must silently add items to the user session without opening modal drawers or blocking user interaction with dark backdrops. A live badge and floating cart pill bar reflect total selections while users freely browse.
- **Reason:** Standard professional e-commerce UX maximizing multi-item basket conversion.
- **Enforcement:** Enforced in `resources/views/storefront.blade.php`.

### 12. Cross-Shop Session Isolation & Auto-Logout
- **Rule:** If an authenticated user belonging to Shop A (owner or employee) visits Shop B's URL (subdomain, custom domain, storefront, or shop panel), they must be automatically logged out of Shop A immediately.
- **Reason:** Prevents cross-shop data leaks, session bleeding, and displaying Shop A details when entering Shop B's URL.
- **Enforcement:**
  - `StorefrontWebController`: Strictly resolves the requested shop and terminates any cross-tenant session before rendering the storefront. Non-existent subdomains abort 404 (never defaulting to Shop Alpha).
  - `EnsureShopAccess`: Invalidates session and redirects unauthorized web requests to `$shop->getSubdomainUrl('/login')` (or returns 403 JSON for API).
  - Subdomain & Custom Domain Routes: Explicit `/logout` (GET/POST) routes provided; storefront header dynamically renders Dashboard and Logout buttons for authorized staff.
  - Verified in `CrossShopSessionIsolationTest`.

