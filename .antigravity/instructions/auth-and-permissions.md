# Feature Instruction: Auth & Permissions

## Overview
GlobalShop uses a dual-guard architecture:
- **`users` table:** Platform Admins (`is_platform_admin = true`), Shop Owners (`Shop.owner_id`), and Shop Employees (`shop_user` pivot table).
- **`marketplace_customers` table:** Marketplace shoppers (`alice@customer.com`).

## Role Definitions
1. **Super Admin:** Full platform control.
2. **Platform Admin:** Platform shop approvals, subscriptions, logs.
3. **Shop Owner:** Complete control over their owned tenant shop.
4. **Manager:** Catalog, staff, and sales terminal access.
5. **Sales Manager:** Catalog view & POS sales terminal execution (`sales.create`).
6. **Worker:** View-only catalog access (`products.index`).
7. **Customer:** Shopping cart, checkout, profile, order history.

## Development Rules
- Always verify tenant access using `$user->belongsToShop($shop)` or `EnsureShopAccess` middleware.
- Never grant tenant authorization purely based on user role string without checking `shop_id`.
