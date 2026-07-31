# Feature Instruction: Products & Catalog

## Overview
`Product` model belongs to `Shop`, `Category`, `Brand`, and has many `ProductImage` assets.

## Key Fields
- `shop_id`, `category_id`, `brand_id`, `name`, `slug`, `description`, `price`, `cost_price`, `stock_quantity`, `stock_unit`, `status` (`published`, `draft`).

## Development Rules
- Product queries must be filtered by `shop_id` using `TenantManager::getTenantId()`.
- Validate price >= 0 and stock_quantity >= 0.
- When a product is updated or deleted, ensure images in `public/storage` are properly managed.
