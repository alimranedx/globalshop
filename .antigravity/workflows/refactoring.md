# Development Workflow: Refactoring

Follow this workflow when refactoring existing code:

1. **Prerequisite Check:** Ensure all automated tests (`php artisan test`) are passing before making modifications.
2. **Identify Boundaries:** Preserve public signatures, routes, API responses, and database contracts.
3. **Incremental Changes:** Refactor in small, verifiable steps.
4. **Preserve Isolation:** Re-verify `TenantManager` and `EnsureShopAccess` logic.
5. **Verify Suite:** Run `php artisan test` after every major step.
6. **No Breaking Changes:** Never introduce unexpected breaking API or UI contract changes without updating documentation.
