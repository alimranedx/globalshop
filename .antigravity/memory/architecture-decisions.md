# GlobalShop — Architecture Decision Records (ADR)

---

## 🏛️ ADR-001: Modular Architecture via `app/Modules`
* **Date:** 2026-07-26
* **Decision:** Organize core business logic into domain modules inside `app/Modules/` (`ShopManager`, `ProductCatalog`, `AuditLog`, `Authorization`).
* **Reason:** Keeps business logic decoupled from HTTP controllers and allows easy expansion for enterprise multi-tenancy.

---

## 🏛️ ADR-002: React 19 SPA Entry Points with Blade Wrappers
* **Date:** 2026-07-26
* **Decision:** Serve three separate React 19 SPAs wrapped in minimal Blade views (`marketplace.blade.php`, `shop.blade.php`, `admin.blade.php`).
* **Reason:** Allows distinct Tailwind styling, React router setups, and Auth context per application panel while keeping single Laravel backend.

---

## 🏛️ ADR-003: SQLite In-Memory Testing with MySQL Production
* **Date:** 2026-07-31
* **Decision:** Use SQLite in-memory database (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) in `phpunit.xml` while using MySQL 8.0 for development and production.
* **Reason:** Executes all 63 unit and feature tests in under 3.5 seconds without polluting dev/prod databases. Requires `pdo_sqlite` extension enabled in PHP runtime.

---

## 🏛️ ADR-004: Multi-Tenant Subdomain Routing for Vendor Shops
* **Date:** 2026-10-20
* **Decision:** Serve vendor shops and their management panels directly on tenant subdomains (`https://{subdomain}.shopbusket.com/catalog-hub/categories`, `/dashboard`, etc.) alongside public storefronts.
* **Subdomain Normalization:** Canonical domains use 3rd-level domain structure (`alpha.shopbusket.com`). 4th-level subdomains (`www.alpha.shopbusket.com`) automatically 301 redirect to the canonical 3rd-level domain to respect wildcard SSL limits.
* **Reserved Subdomain Protection:** System subdomains (`www`, `admin`, `api`, `app`, `mail`, `cpanel`, `webmail`, `billing`, `support`) are rejected from being claimed or routed as tenant shops.
* **Dual Routing Compatibility:** Both subdomain routes and path routes (`/shop/{slug}/*`) are supported simultaneously. React Router dynamically toggles its `basename` between root `/` (when loaded on a subdomain) and `/shop/{slug}` (when loaded via central domain path).

---

## 🏛️ ADR-005: Automated cPanel Subdomain Provisioning & Deletion
* **Date:** 2026-10-20
* **Decision:** Automate subdomain creation and deletion at the hosting level via cPanel UAPI (`SubDomain::addsubdomain` and `SubDomain::delsubdomain`).
* **Wildcard Fallback:** cPanel Wildcard Subdomain `*.shopbusket.com` and Wildcard DNS `*` are permanently enabled pointing to `/home/shopbusk/public_html`, ensuring zero propagation delay and 100% uptime for new shops.
* **Model Hooks:** `Shop::created` provisions the cPanel subdomain, and `Shop::deleted` automatically deletes the subdomain from cPanel. Handled via `CpanelSubdomainService` using full-access cPanel API tokens.

---

## 🏛️ ADR-006: Custom Domain Mapping & DNS Verification Engine
* **Date:** 2026-10-20
* **Decision:** Provide merchants with full custom brand domain mapping (e.g. `https://alphagear.com` or `https://store.alphabrand.com`) routing to their dedicated store on the same multi-tenant infrastructure.
* **Routing Detection:** `Shop::resolveCustomDomainShop($host)` strips ports and handles both `www.` and non-`www.` variations. Central/base domains (`shopbusket.com`, `localhost`) are guarded to prevent marketplace route collision.
* **Direct Web Handlers:** Root `/`, `/catalog`, `/storefront`, `/login`, `/dashboard`, and `/{any}` panel routes immediately resolve the custom-mapped shop and serve its branded UI.
* **DNS Verification:** `POST /api/v1/tenant/custom-domain/verify` performs automatic DNS lookups (`gethostbyname`) checking for server IP `104.152.168.205` or CNAME mapping before marking status as `verified`.
* **Self-Service Merchant UI:** Built directly into `SettingsView.jsx` allowing shop owners to connect, test, and disconnect custom domains with live status badges.

---

## 🏛️ ADR-007: Silent Frictionless Add-To-Cart & Storefront E-Commerce Engine
* **Date:** 2026-10-20
* **Decision:** Decouple "Add to Cart" product additions from full-screen modal overlays to allow non-blocking, continuous browsing across the product catalog.
* **User Experience:**
  - Clicking "Add to Cart" updates the cart in-memory silently without popping up the full drawer or covering the screen with a backdrop.
  - Header badge increments live with a micro-bounce animation.
  - A subtle slide-in toast confirms addition at the bottom-right.
  - A sticky floating cart pill bar appears at bottom center displaying total selected items and instant checkout shortcuts.
  - Direct 1-click checkout is preserved on the "Buy Now" button.
* **Fallback Image Safety:** All storefront product and slide images enforce `onerror` placeholder handlers to eliminate broken image icons on production.
