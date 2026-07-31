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
