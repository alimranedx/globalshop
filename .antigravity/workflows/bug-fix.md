# Development Workflow: Bug Fix

Follow this 10-step workflow for fixing bugs:

1. **Reproduce:** Reproduce the bug using a minimal test case or artisan command.
2. **Logs & Stack Trace:** Fetch full un-truncated error logs from `storage/logs/laravel.log` or test runner output.
3. **Understand:** Identify the root cause without masking symptoms.
4. **Inspect Architecture:** Check whether the issue affects other tenant shops or modules.
5. **Implement Fix:** Fix the underlying contract or data flow cleanly.
6. **Add Automated Test:** Write a PHPUnit test case in `tests/Feature/` reproducing the exact failure mode.
7. **Verify Fix:** Run `php artisan test` to confirm the test passes.
8. **Regression Check:** Run full test suite to ensure zero side effects.
9. **Update Known Issues:** If systemic, document the bug and fix in `.antigravity/memory/known-issues.md`.
10. **Review:** Ensure no debug logs or temporary code remains.
