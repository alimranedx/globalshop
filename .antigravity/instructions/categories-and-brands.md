# Feature Instruction: Categories & Brands

## Overview
`Category` and `Brand` models represent shop-scoped catalog hierarchies.

## Global Scopes
- Both models use `BelongsToTenant` global scopes for strict tenant isolation. Use `Category::withoutGlobalScopes()` or `Brand::withoutGlobalScopes()` only when explicit cross-tenant admin operations are required.
- Categories and Brands are completely independent per shop. No global or cross-tenant leakage.

## Development Rules
- Category & Brand slugs must be unique per shop.
- Deleting a category or brand must check for attached active products.
- Shop owners and managers have full control to add, edit, and delete their own categories and brands.
