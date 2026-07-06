<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Modules\AuditLog\Actions\LogActivityAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SalesController extends Controller
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * List all sales for the active tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $query = Sale::with(['items', 'creator'])->orderBy('created_at', 'desc');

        // Apply Date range filters if provided
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Apply payment method filter
        if ($request->has('payment_method') && $request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        // Search text
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $sales = $query->get();

        return response()->json([
            'success' => true,
            'data' => $sales,
        ]);
    }

    /**
     * Store a new sale transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'payment_method' => 'required|string|in:cash,card,mobile',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request, $shop) {
                $subtotal = 0.00;
                $itemsToCreate = [];

                // 1. Validate Stock and Calculate Subtotal
                foreach ($request->items as $itemData) {
                    $product = Product::lockForUpdate()->find($itemData['product_id']);

                    if ($product->stock_quantity < $itemData['quantity']) {
                        throw new \Exception("Insufficient stock for product '{$product->name}'. Available: {$product->stock_quantity} {$product->stock_unit}.");
                    }

                    // Decrement stock
                    $product->decrement('stock_quantity', $itemData['quantity']);

                    $itemTotal = round($product->price * $itemData['quantity'], 2);
                    $subtotal += $itemTotal;

                    $itemsToCreate[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => $itemData['quantity'],
                        'price' => $product->price,
                        'total' => $itemTotal,
                    ];
                }

                $discount = $request->input('discount', 0.00);
                $tax = $request->input('tax', 0.00);
                $total = round($subtotal - $discount + $tax, 2);
                if ($total < 0) $total = 0.00;

                // Generate Invoice number
                $invoiceNumber = 'INV-' . strtoupper(Str::random(8)) . '-' . time();

                // 2. Create Sale Record
                $sale = Sale::create([
                    'shop_id' => $shop->id,
                    'invoice_number' => $invoiceNumber,
                    'customer_name' => $request->input('customer_name'),
                    'customer_email' => $request->input('customer_email'),
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'total' => $total,
                    'payment_method' => $request->input('payment_method'),
                    'created_by' => auth()->id(),
                ]);

                // 3. Create Sale Items
                foreach ($itemsToCreate as $item) {
                    $sale->items()->create($item);
                }

                // 4. Log Activity
                $this->logger->execute(
                    'sale.created',
                    "New sale checked out. Invoice: {$invoiceNumber}. Total: $" . $total . ".",
                    null,
                    ['invoice' => $invoiceNumber, 'total' => $total],
                    $shop->id,
                    auth()->id()
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Sale checkout successfully completed!',
                    'data' => $sale->load('items'),
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
