# Feature Instruction: Security & Multi-Tenant Isolation

## Security Mandates
1. **Never Trust Frontend Claims:** Always validate permissions and tenant boundaries in Laravel middleware and controller actions.
2. **Prevent IDOR:** Validate that requested `product_id`, `category_id`, `brand_id`, or `order_id` belongs to the authenticated user's active tenant shop.
3. **Password Hashing:** Passwords hashed with Bcrypt (12 rounds in production, 4 rounds in testing).
4. **Secrets Protection:** Never commit `.env` files, API keys, passwords, or private keys. Verify `.gitignore` rules before committing.
