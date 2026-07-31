# Feature Instruction: Orders & Customer Checkout

## Overview
Customer marketplace orders are processed via `MarketplaceCustomerController`.

## Order Workflow
1. Add items to cart drawer (`/cart`).
2. Fill recipient shipping address & payment method.
3. Submit checkout $\rightarrow$ Generate invoice number `INV-...`.
4. Create `Sale` and `SaleItem` records.
5. Decrement inventory stock.
6. Display order confirmation & receipt.
