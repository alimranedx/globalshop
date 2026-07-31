# GlobalShop — Known Issues & Systemic Workarounds

This document records active known issues, environment requirements, and workarounds.

---

## 🔍 Issue Matrix

| Issue ID | Affected Area | Impact | Root Cause & Workaround | Status |
|---|---|---|---|---|
| **ISSUE-001** | PHPUnit Test Suite | Test suite fails with `could not find driver (Connection: sqlite)` | Missing `pdo_sqlite` or `sqlite3` extension in `php.ini`. **Workaround:** Enable `extension=pdo_sqlite` and `extension=sqlite3` in active PHP CLI `php.ini`. | **Resolved in Env** |
| **ISSUE-002** | React SPA Page Refresh | 404 Not Found error when refreshing routes like `/shop/alpha/dashboard` | Nginx/Apache web server missing fallback to `index.php`. **Workaround:** Ensure web server configuration includes `try_files $uri $uri/ /index.php?$query_string;`. | **Documented in DEPLOYMENT.md** |
| **ISSUE-003** | Local Dev Database Missing | `Unknown database 'globalshop'` error on fresh setup | MySQL database must be initialized manually or via script. **Workaround:** Execute `CREATE DATABASE IF NOT EXISTS globalshop;` prior to running `php artisan migrate`. | **Resolved in Setup** |
