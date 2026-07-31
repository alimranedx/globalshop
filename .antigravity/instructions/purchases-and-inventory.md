# Feature Instruction: Purchases & Inventory

## Overview
Sales transactions are handled via the `Sale` and `SaleItem` models.

## Inventory Rules
- Submitting a POS sale or customer checkout MUST decrement `Product.stock_quantity` by the purchased amount.
- Formula: $\text{New Stock} = \text{Current Stock} - \text{Quantity}$
- Verify stock availability before completing transaction. Reject order if `stock_quantity < requested_quantity`.
