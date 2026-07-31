# Feature Instruction: Testing Standard

## Automated Testing Suite
- Framework: PHPUnit / Laravel Feature Testing (`tests/Feature/`).
- Command: `php artisan test`
- Configuration: `phpunit.xml` uses `DB_CONNECTION=sqlite` with `:memory:`.

## Test Requirements
- Every new feature or bug fix MUST include automated tests.
- Test both positive (authorized access, successful purchase) and negative cases (cross-shop access blocked, unauthorized deletion denied).
- Ensure all 63+ existing test cases pass cleanly before declaring completion.
