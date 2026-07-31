# Feature Instruction: Shop Management

## Overview
Shops are the core multi-tenant entity (`Shop` model). Each shop has a unique slug (`/shop/{slug}`) and owner (`owner_id`).

## Key Actions & Controllers
- **Registration:** `RegisterShopAction::execute($shopData, $ownerData, $planId, $status)`
- **Discovery:** `ShopDiscoveryController` lists published shops for marketplace selection.
- **Easy Login Hub:** `EasyLoginController` (local dev only at `/shop/easy-login`) allows single-click role switching.

## Development Rules
- Shop statuses: `active`, `pending`, `suspended`, `draft`.
- Suspended shops must return `HTTP 403` on all routes via `EnsureShopAccess`.
