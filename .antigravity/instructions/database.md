# Feature Instruction: Database & Migrations

## Database Configuration
- Engine: MySQL 8.0 / MariaDB 10.4+ in dev and production.
- Connection: `DB_CONNECTION=mysql`, `DB_DATABASE=globalshop`.
- Testing: SQLite in-memory (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`).

## Migration & Seeding Rules
- Never use `migrate:fresh` in production.
- Always include `shop_id` foreign keys on tenant-scoped tables (`categories`, `brands`, `products`, `sales`, `roles`).
- Execute `php artisan migrate` after creating migrations.
