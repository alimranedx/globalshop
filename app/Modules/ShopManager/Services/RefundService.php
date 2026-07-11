<?php

namespace App\Modules\ShopManager\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Modules\AuditLog\Actions\LogActivityAction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class RefundService
{
    protected SalesSummaryService $summaryService;
    protected LogActivityAction $logger;

    public function __construct(SalesSummaryService $summaryService, LogActivityAction $logger)
    {
        $this->summaryService = $summaryService;
        $this->logger = $logger;
    }

    /**
     * Check if a user has permission to approve/directly refund.
     */
    public function canApproveDirectly(User $user, $shop): bool
    {
        if ($user->id === $shop->owner_id) {
            return true;
        }

        // Check if user has roles with sales.refund_approve permission
        // Let's see how roles/permissions are checked.
        // We can check if the user has a role page with page_identifier 'sales.refund_approve'
        $shopUser = DB::table('shop_user')
            ->where('shop_id', $shop->id)
            ->where('user_id', $user->id)
            ->first();

        if ($shopUser) {
            $hasPerm = DB::table('role_pages')
                ->where('role_id', $shopUser->role_id)
                ->where('page_identifier', 'sales.refund_approve')
                ->exists();
            if ($hasPerm) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a user has permission to cancel/reject refund requests.
     */
    public function canCancelRefund(User $user, $shop, Refund $refund): bool
    {
        if ($user->id === $shop->owner_id) {
            return true;
        }

        if ($refund->created_by === $user->id && $refund->status === 'pending') {
            return true;
        }

        // Otherwise check permission 'sales.refund_approve' or maybe a cancel permission
        $shopUser = DB::table('shop_user')
            ->where('shop_id', $shop->id)
            ->where('user_id', $user->id)
            ->first();

        if ($shopUser) {
            return DB::table('role_pages')
                ->where('role_id', $shopUser->role_id)
                ->whereIn('page_identifier', ['sales.refund_approve', 'sales.refund_cancel'])
                ->exists();
        }

        return false;
    }

    /**
     * Create a refund request (either direct completed, or pending approval).
     */
    public function requestRefund(Sale $sale, array $data, User $actor): Refund
    {
        $shop = $sale->shop;
        if (!$shop) {
            throw new \Exception("Active shop not found.");
        }

        // Check refund window
        $refundWindow = $shop->refund_window_days ?? 30;
        $saleDate = Carbon::parse($sale->created_at);
        $daysDiff = $saleDate->diffInDays(Carbon::now());

        $isAuthorized = $this->canApproveDirectly($actor, $shop);

        if ($daysDiff > $refundWindow && !$isAuthorized) {
            throw ValidationException::withMessages([
                'sale_date' => ["This sale was made {$daysDiff} days ago, which exceeds the shop's refund window of {$refundWindow} days. Only managers or owners can bypass this limit."]
            ]);
        }

        // Start transaction and lock sale to prevent double-refunding
        return DB::transaction(function () use ($sale, $data, $actor, $shop, $isAuthorized) {
            $sale = Sale::lockForUpdate()->find($sale->id);

            if ($sale->status === 'refunded') {
                throw new \Exception("This sale has already been fully refunded.");
            }

            $refundAmount = round((float)$data['refund_amount'], 2);
            $type = $data['type']; // 'full' or 'partial'
            $refundMethod = $data['refund_method']; // 'original_method', 'cash', 'card', 'mobile', 'store_credit'
            $reason = $data['reason'] ?? 'No reason provided';
            $notes = $data['notes'] ?? null;
            $items = $data['items'] ?? [];

            // Calculate remaining refundable amount
            $remainingAmount = round($sale->total - $sale->refunded_amount, 2);
            if ($refundAmount > $remainingAmount) {
                throw new \Exception("Requested refund amount ($" . $refundAmount . ") exceeds the remaining refundable balance of the sale ($" . $remainingAmount . ").");
            }

            // Determine if it should be directly completed
            $status = $isAuthorized ? 'completed' : 'pending';

            // Store credit validations
            $customer = null;
            if ($refundMethod === 'store_credit') {
                if ($sale->customer_id) {
                    $customer = Customer::find($sale->customer_id);
                } elseif (!empty($data['customer_phone'])) {
                    // Find or create customer
                    $customer = Customer::where('shop_id', $shop->id)
                        ->where('phone', $data['customer_phone'])
                        ->first();

                    if (!$customer) {
                        $customer = Customer::create([
                            'shop_id' => $shop->id,
                            'name' => $data['customer_name'] ?? 'Walk-in Customer',
                            'phone' => $data['customer_phone'],
                            'email' => $data['customer_email'] ?? null,
                            'membership_number' => 'MEM-' . strtoupper(Str::random(6)),
                            'store_credit_balance' => 0.00
                        ]);
                    }
                } else {
                    throw new \Exception("Store credit refund method requires a customer profile or phone number.");
                }
            }

            // Generate refund number
            $refundNumber = 'RFN-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // Create Master Refund record
            $refund = Refund::create([
                'shop_id' => $shop->id,
                'sale_id' => $sale->id,
                'refund_number' => $refundNumber,
                'type' => $type,
                'status' => $status,
                'reason' => $reason,
                'notes' => $notes,
                'refund_amount' => $refundAmount,
                'refund_method' => $refundMethod,
                'created_by' => $actor->id,
                'approved_by' => $status === 'completed' ? $actor->id : null,
                'approved_at' => $status === 'completed' ? Carbon::now() : null,
                'completed_at' => $status === 'completed' ? Carbon::now() : null,
            ]);

            // Validate and create items
            $itemRefundSum = 0.00;
            foreach ($items as $itemData) {
                $saleItem = SaleItem::find($itemData['sale_item_id']);
                if (!$saleItem || $saleItem->sale_id !== $sale->id) {
                    throw new \Exception("Invalid sale item specified.");
                }

                $qtyToRefund = (float)$itemData['quantity'];
                $availableQty = (float)($saleItem->quantity - $saleItem->refunded_qty);

                if ($qtyToRefund > $availableQty) {
                    throw new \Exception("Cannot refund {$qtyToRefund} of '{$saleItem->product_name}'. Only {$availableQty} is available for refund.");
                }

                $itemAmount = round((float)$itemData['refund_amount'], 2);
                $itemRefundSum += $itemAmount;

                RefundItem::create([
                    'refund_id' => $refund->id,
                    'sale_item_id' => $saleItem->id,
                    'product_id' => $saleItem->product_id,
                    'product_name' => $saleItem->product_name,
                    'quantity' => $qtyToRefund,
                    'unit_price' => $saleItem->price,
                    'cost_price' => $saleItem->cost_price,
                    'refund_amount' => $itemAmount,
                    'restock' => $itemData['restock'] ?? true,
                ]);

                // If completed immediately, update stock and refunded_qty
                if ($status === 'completed') {
                    $saleItem->increment('refunded_qty', $qtyToRefund);

                    if (!empty($itemData['restock'])) {
                        $product = Product::find($saleItem->product_id);
                        if ($product) {
                            $product->increment('stock_quantity', $qtyToRefund);
                        }
                    }
                }
            }

            // For full refund, if items were not sent, auto-generate them
            if (empty($items) && $type === 'full') {
                foreach ($sale->items as $saleItem) {
                    $availableQty = (float)($saleItem->quantity - $saleItem->refunded_qty);
                    if ($availableQty > 0) {
                        $itemAmount = round($availableQty * $saleItem->price, 2);
                        $itemRefundSum += $itemAmount;

                        RefundItem::create([
                            'refund_id' => $refund->id,
                            'sale_item_id' => $saleItem->id,
                            'product_id' => $saleItem->product_id,
                            'product_name' => $saleItem->product_name,
                            'quantity' => $availableQty,
                            'unit_price' => $saleItem->price,
                            'cost_price' => $saleItem->cost_price,
                            'refund_amount' => $itemAmount,
                            'restock' => true,
                        ]);

                        if ($status === 'completed') {
                            $saleItem->increment('refunded_qty', $availableQty);
                            $product = Product::find($saleItem->product_id);
                            if ($product) {
                                $product->increment('stock_quantity', $availableQty);
                            }
                        }
                    }
                }
            }

            // If completed immediately, finalize financial updates
            if ($status === 'completed') {
                // Check store credit
                if ($refundMethod === 'store_credit' && $customer) {
                    $customer->increment('store_credit_balance', $refundAmount);
                }

                // Associate customer to sale if not done already
                if ($customer && !$sale->customer_id) {
                    $sale->update(['customer_id' => $customer->id]);
                }

                // Increment refund amount on sale
                $sale->increment('refunded_amount', $refundAmount);

                // Update sale status
                $newStatus = ($sale->refunded_amount >= $sale->total) ? 'refunded' : 'partially_refunded';
                $sale->update(['status' => $newStatus]);

                // Record to daily summaries
                $this->summaryService->recordRefund($shop->id, Carbon::now(), $refundAmount);

                $this->logger->execute(
                    'refund.completed',
                    "Refund {$refundNumber} processed directly for Invoice {$sale->invoice_number}. Amount: $" . $refundAmount . ".",
                    null,
                    ['refund_number' => $refundNumber, 'amount' => $refundAmount],
                    $shop->id,
                    $actor->id
                );
            } else {
                $this->logger->execute(
                    'refund.requested',
                    "Refund request {$refundNumber} submitted for Invoice {$sale->invoice_number}. Amount: $" . $refundAmount . ". Status: Pending.",
                    null,
                    ['refund_number' => $refundNumber, 'amount' => $refundAmount],
                    $shop->id,
                    $actor->id
                );
            }

            return $refund;
        });
    }

    /**
     * Approve and Complete a pending refund.
     */
    public function approveRefund(Refund $refund, User $approver): Refund
    {
        $shop = $refund->sale->shop;
        if (!$this->canApproveDirectly($approver, $shop)) {
            throw new \Exception("Unauthorized to approve refunds.");
        }

        if ($refund->status !== 'pending') {
            throw new \Exception("Only pending refunds can be approved.");
        }

        return DB::transaction(function () use ($refund, $approver, $shop) {
            $sale = Sale::lockForUpdate()->find($refund->sale_id);

            // Double check availability
            $remainingAmount = round($sale->total - $sale->refunded_amount, 2);
            if ($refund->refund_amount > $remainingAmount) {
                throw new \Exception("This refund amount exceeds the remaining refundable balance.");
            }

            // 1. Process items (update stocks and refunded_qty)
            foreach ($refund->items as $item) {
                $saleItem = SaleItem::find($item->sale_item_id);
                if ($saleItem) {
                    $availableQty = (float)($saleItem->quantity - $saleItem->refunded_qty);
                    if ($item->quantity > $availableQty) {
                        throw new \Exception("Item '{$item->product_name}' cannot be refunded. Requested quantity exceeds remaining quantity.");
                    }
                    $saleItem->increment('refunded_qty', $item->quantity);
                }

                if ($item->restock) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->increment('stock_quantity', $item->quantity);
                    }
                }
            }

            // 2. Add store credit if needed
            if ($refund->refund_method === 'store_credit') {
                $customer = null;
                if ($sale->customer_id) {
                    $customer = Customer::find($sale->customer_id);
                }
                
                if ($customer) {
                    $customer->increment('store_credit_balance', $refund->refund_amount);
                }
            }

            // 3. Update master sale
            $sale->increment('refunded_amount', $refund->refund_amount);
            $newStatus = ($sale->refunded_amount >= $sale->total) ? 'refunded' : 'partially_refunded';
            $sale->update(['status' => $newStatus]);

            // 4. Update Refund status to completed
            $refund->update([
                'status' => 'completed',
                'approved_by' => $approver->id,
                'approved_at' => Carbon::now(),
                'completed_at' => Carbon::now(),
            ]);

            // 5. Update daily summary
            $this->summaryService->recordRefund($shop->id, Carbon::now(), $refund->refund_amount);

            $this->logger->execute(
                    'refund.completed',
                    "Refund {$refund->refund_number} approved and completed for Invoice {$sale->invoice_number}. Amount: $" . $refund->refund_amount . ".",
                    null,
                    ['refund_number' => $refund->refund_number, 'amount' => $refund->refund_amount],
                    $shop->id,
                    $approver->id
                );

            return $refund;
        });
    }

    /**
     * Cancel/Reject a refund.
     */
    public function cancelRefund(Refund $refund, User $actor): Refund
    {
        $shop = $refund->sale->shop;
        if (!$this->canCancelRefund($actor, $shop, $refund)) {
            throw new \Exception("Unauthorized to cancel/reject this refund.");
        }

        if ($refund->status !== 'pending') {
            throw new \Exception("Only pending refunds can be cancelled.");
        }

        $refund->update([
            'status' => 'cancelled',
        ]);

        $this->logger->execute(
            'refund.cancelled',
            "Refund {$refund->refund_number} was cancelled/rejected by user.",
            null,
            ['refund_number' => $refund->refund_number],
            $shop->id,
            $actor->id
        );

        return $refund;
    }
}
