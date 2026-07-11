<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Refund;
use App\Models\Sale;
use App\Models\Customer;
use App\Modules\ShopManager\Services\RefundService;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RefundController extends Controller
{
    protected RefundService $refundService;

    public function __construct(RefundService $refundService)
    {
        $this->refundService = $refundService;
    }

    /**
     * List all refunds for the active shop.
     */
    public function index(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $query = Refund::with(['sale', 'creator', 'approver', 'items'])
            ->where('shop_id', $shop->id)
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        if ($request->has('refund_method') && $request->refund_method) {
            $query->where('refund_method', $request->refund_method);
        }

        // Search text
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('refund_number', 'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%")
                  ->orWhereHas('sale', function ($sq) use ($search) {
                      $sq->where('invoice_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%");
                  });
            });
        }

        $refunds = $query->get();

        return response()->json([
            'success' => true,
            'data' => $refunds,
        ]);
    }

    /**
     * Get single refund details.
     */
    public function show(Refund $refund): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $refund->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Refund record not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $refund->load(['sale.items', 'creator', 'approver', 'items.saleItem']),
        ]);
    }

    /**
     * Get refundable info for a sale.
     */
    public function refundable(Sale $sale): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $sale->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Sale not found.'], 404);
        }

        $items = $sale->items->map(function ($item) {
            $availableQty = $item->quantity - $item->refunded_qty;
            $availableRefundAmount = round($availableQty * $item->price, 2);
            return [
                'sale_item_id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'quantity' => (float)$item->quantity,
                'refunded_qty' => (float)$item->refunded_qty,
                'available_qty' => (float)max(0, $availableQty),
                'price' => (float)$item->price,
                'total' => (float)$item->total,
                'available_refund_amount' => (float)max(0, $availableRefundAmount),
            ];
        });

        $remainingTotal = max(0, round($sale->total - $sale->refunded_amount, 2));

        return response()->json([
            'success' => true,
            'data' => [
                'sale_id' => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'customer_name' => $sale->customer_name,
                'customer_email' => $sale->customer_email,
                'total' => (float)$sale->total,
                'refunded_amount' => (float)$sale->refunded_amount,
                'remaining_refundable' => (float)$remainingTotal,
                'items' => $items,
                'refund_window_days' => $shop->refund_window_days ?? 30,
                'created_at' => $sale->created_at,
            ]
        ]);
    }

    /**
     * Store/Request a refund.
     */
    public function store(Request $request, Sale $sale): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $sale->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Sale not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'refund_amount' => 'required|numeric|min:0.01',
            'type' => 'required|string|in:full,partial',
            'refund_method' => 'required|string|in:original_method,cash,card,mobile,store_credit',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:25',
            'customer_email' => 'nullable|email|max:255',
            'items' => 'nullable|array',
            'items.*.sale_item_id' => 'required|integer',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.refund_amount' => 'required|numeric|min:0.00',
            'items.*.restock' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $refund = $this->refundService->requestRefund($sale, $request->all(), auth()->user());
            return response()->json([
                'success' => true,
                'message' => $refund->status === 'completed' 
                    ? 'Refund processed successfully!' 
                    : 'Refund request submitted for approval.',
                'data' => $refund->load(['items', 'creator']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Approve a pending refund.
     */
    public function approve(Refund $refund): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $refund->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Refund record not found.'], 404);
        }

        try {
            $approved = $this->refundService->approveRefund($refund, auth()->user());
            return response()->json([
                'success' => true,
                'message' => 'Refund request has been approved and completed!',
                'data' => $approved,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Cancel/Reject a pending refund.
     */
    public function cancel(Refund $refund): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $refund->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Refund record not found.'], 404);
        }

        try {
            $cancelled = $this->refundService->cancelRefund($refund, auth()->user());
            return response()->json([
                'success' => true,
                'message' => 'Refund request has been cancelled/rejected.',
                'data' => $cancelled,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * List all customers or query customer profiles by phone/membership.
     */
    public function customers(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $query = Customer::where('shop_id', $shop->id);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('membership_number', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->limit(20)->get();

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }
}
