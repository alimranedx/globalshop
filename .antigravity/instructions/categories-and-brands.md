# Feature Instruction: Categories & Brands

## Overview
`Category` and `Brand` models represent shop-scoped catalog hierarchies.

## Global Scopes
- Both models use global scopes for tenant isolation. Use `Category::withoutGlobalScopes()` or `Brand::withoutGlobalScopes()` only when explicit cross-tenant admin operations are required.

## Development Rules
- Category & Brand slugs must be unique per shop.
- Deleting a category or brand should check for attached active products.
