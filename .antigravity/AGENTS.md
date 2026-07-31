# GlobalShop — Master AI Agent Instructions & Operating Rules

> **Single Source of Truth for AI Agents & Assistant Developers**  
> **Repository:** `GlobalShop` (Laravel 13 + React 19 + Vite + MySQL Multi-Tenant SaaS Marketplace)

---

## 🛑 MANDATORY MANDATE: Before Executing ANY Work

Every AI agent or developer working on this codebase **MUST** follow this sequence before making code, configuration, or database modifications:

1. **Read Master Instructions:** `.antigravity/AGENTS.md`
2. **Read Project Memory:** `.antigravity/memory/project-memory.md`
3. **Read Feature & Architecture Decisions:** `.antigravity/memory/feature-decisions.md` & `.antigravity/memory/architecture-decisions.md`
4. **Read Relevant Feature Instructions:** `.antigravity/instructions/*.md` (e.g. `auth-and-permissions.md`, `shop-management.md`, `products.md`)
5. **Read Workflow Standard:** `.antigravity/workflows/*.md` (`new-feature.md`, `bug-fix.md`, `refactoring.md`)
6. **Inspect Existing Implementation:** Inspect exact models, routes, controllers, middleware, and tests.
7. **Formulate Plan & Verify Side Effects:** Never blindly mutate code without identifying tenant isolation, permissions, or API contract impacts.
8. **Test & Review:** Run `php artisan test` and verify positive/negative permission scenarios.
9. **Update Permanent Memory:** Update `.antigravity/memory/` if new architectural decisions or permanent business rules were established.

---

## 🏛️ Core Project Architectural Rules

### 1. Multi-Tenant Shop Isolation is NON-NEGOTIABLE
GlobalShop serves multiple independent shops (`Shop Alpha`, `Shop Beta`, `Shop Gamma`, `Shop Delta`).
- **Tenant Scope:** Every shop-scoped model (`Category`, `Brand`, `Product`, `ProductImage`, `Sale`, `Role`) must enforce tenant isolation via `TenantManager::getTenantId()`.
- **Cross-Shop Access:** A user or shop employee from Shop A must **NEVER** access, view, update, or delete Shop B's resources.
- **IDOR Protection:** Never trust raw IDs passed in requests. Always filter through `TenantManager` or verify `$user->belongsToShop($shop)`.

### 2. Three Panel SPA Architecture
GlobalShop exposes 3 distinct frontend panels sharing the single Laravel backend:
* **Public Marketplace (`/`):** Guest & Marketplace customer portal (`marketplace.blade.php` + `marketplace.jsx`).
* **Shop Management (`/shop/{slug}/*`):** Multi-tenant shop dashboard, catalog hub, staff management, POS terminal (`shop.blade.php` + `shop.jsx`).
* **Platform Admin Console (`/admin/*`):** Super Admin & Platform Admin console (`admin.blade.php` + `admin.jsx`).

### 3. Permission & Role Hierarchy
- **Platform Admins:** `is_platform_admin = true` on `User` model (Super Admin, Grace Admin). Bypasses tenant restrictions for platform management (`/admin`).
- **Shop Owners:** `owner_id` on `Shop` model. Full control over their owned shop.
- **Shop Employees:** Linked via `shop_user` pivot table with assigned `Role` (`Manager`, `Sales Manager`, `Worker`).
- **Marketplace Customers:** Managed via `MarketplaceCustomer` model (`alice@customer.com`). Separate from shop employees/admins.

---

## 📋 Task Checklist for Agents

### Pre-Implementation Checklist
- [ ] Read `.antigravity/AGENTS.md` and relevant `.antigravity/instructions/`
- [ ] Inspected existing database schema and model relations
- [ ] Checked `TenantManager` scoping requirements
- [ ] Formulated implementation plan

### Post-Implementation Checklist
- [ ] Executed `php artisan test` (Verify 63/63 tests pass)
- [ ] Executed `npm run build` (Verify Vite asset compilation)
- [ ] Verified cross-shop tenant isolation (Shop A cannot access Shop B)
- [ ] Updated `.antigravity/memory/` if permanent rules changed
