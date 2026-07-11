<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Modules\AuditLog\Actions\LogActivityAction;
use App\Modules\ShopManager\Services\SalesSummaryService;
use App\Modules\ShopManager\TenantManager;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SalesController extends Controller
{
    protected LogActivityAction $logger;
    protected SalesSummaryService $summaryService;

    public function __construct(LogActivityAction $logger, SalesSummaryService $summaryService)
    {
        $this->logger = $logger;
        $this->summaryService = $summaryService;
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
                        'cost_price' => $product->cost_price,
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

                // 4. Update Daily Summary (denormalized analytics)
                $totalCost = collect($itemsToCreate)->sum(fn ($i) => round($i['cost_price'] * $i['quantity'], 2));
                $this->summaryService->recordSale(
                    $shop->id,
                    Carbon::now(),
                    $total,
                    $totalCost,
                    $discount,
                    $tax
                );

                // 5. Log Activity
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

    /**
     * Export the filtered sales log to CSV or XLS (Excel HTML table layout).
     */
    public function export(Request $request)
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $query = Sale::with(['items', 'creator'])->orderBy('created_at', 'desc');

        // Apply same filters as index
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $sales = $query->get();
        $format = strtolower($request->input('format', 'csv'));

        if ($format === 'xlsx') {
            return $this->exportToHtmlExcel($sales, $shop->name);
        }

        return $this->exportToCsv($sales);
    }

    private function exportToCsv($sales)
    {
        $headers = [
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Content-type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename=sales_export.csv',
            'Expires'             => '0',
            'Pragma'              => 'public'
        ];

        $callback = function() use ($sales) {
            $file = fopen('php://output', 'w');
            
            // UTF-8 BOM for Microsoft Excel Compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, [
                'Invoice Number',
                'Date',
                'Cashier',
                'Customer Name',
                'Customer Email',
                'Payment Method',
                'Subtotal',
                'Discount',
                'Tax',
                'Total',
                'Items Sold'
            ]);

            foreach ($sales as $sale) {
                $itemsDesc = $sale->items->map(function ($item) {
                    return $item->product_name . ' (' . (float)$item->quantity . ' @ $' . number_format($item->price, 2) . ')';
                })->implode(', ');

                fputcsv($file, [
                    $sale->invoice_number,
                    $sale->created_at->toDateTimeString(),
                    $sale->creator ? $sale->creator->name : 'N/A',
                    $sale->customer_name ?: 'N/A',
                    $sale->customer_email ?: 'N/A',
                    ucfirst($sale->payment_method),
                    number_format($sale->subtotal, 2, '.', ''),
                    number_format($sale->discount, 2, '.', ''),
                    number_format($sale->tax, 2, '.', ''),
                    number_format($sale->total, 2, '.', ''),
                    $itemsDesc
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function exportToHtmlExcel($sales, $shopName)
    {
        $headers = [
            'Content-Type'        => 'application/vnd.ms-excel; charset=utf-8',
            'Content-Disposition' => 'attachment; filename=sales_export.xls',
            'Cache-Control'       => 'max-age=0',
        ];

        $output = '<?xml version="1.0" encoding="utf-8"?>' . "\n";
        $output .= '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' . "\n";
        $output .= '<head>' . "\n";
        $output .= '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sales Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' . "\n";
        $output .= '<style>td { mso-number-format:"\@"; } .number { mso-number-format:"\#\,\#\#0\.00"; } th { background-color: #6366f1; color: white; font-weight: bold; }</style>' . "\n";
        $output .= '</head>' . "\n";
        $output .= '<body>' . "\n";
        $output .= '<h2>Sales Report for ' . htmlspecialchars($shopName) . '</h2>' . "\n";
        $output .= '<table border="1">' . "\n";
        $output .= '<thead>' . "\n";
        $output .= '<tr>' . "\n";
        $output .= '<th>Invoice Number</th>' . "\n";
        $output .= '<th>Date</th>' . "\n";
        $output .= '<th>Cashier</th>' . "\n";
        $output .= '<th>Customer Name</th>' . "\n";
        $output .= '<th>Customer Email</th>' . "\n";
        $output .= '<th>Payment Method</th>' . "\n";
        $output .= '<th>Subtotal</th>' . "\n";
        $output .= '<th>Discount</th>' . "\n";
        $output .= '<th>Tax</th>' . "\n";
        $output .= '<th>Total</th>' . "\n";
        $output .= '<th>Items Sold</th>' . "\n";
        $output .= '</tr>' . "\n";
        $output .= '</thead>' . "\n";
        $output .= '<tbody>' . "\n";

        foreach ($sales as $sale) {
            $itemsDesc = $sale->items->map(function ($item) {
                return $item->product_name . ' (' . (float)$item->quantity . ' @ $' . number_format($item->price, 2) . ')';
            })->implode(', ');

            $output .= '<tr>' . "\n";
            $output .= '<td>' . htmlspecialchars($sale->invoice_number) . '</td>' . "\n";
            $output .= '<td>' . htmlspecialchars($sale->created_at->toDateTimeString()) . '</td>' . "\n";
            $output .= '<td>' . htmlspecialchars($sale->creator ? $sale->creator->name : 'N/A') . '</td>' . "\n";
            $output .= '<td>' . htmlspecialchars($sale->customer_name ?: 'N/A') . '</td>' . "\n";
            $output .= '<td>' . htmlspecialchars($sale->customer_email ?: 'N/A') . '</td>' . "\n";
            $output .= '<td>' . htmlspecialchars(ucfirst($sale->payment_method)) . '</td>' . "\n";
            $output .= '<td class="number">' . number_format($sale->subtotal, 2, '.', '') . '</td>' . "\n";
            $output .= '<td class="number">' . number_format($sale->discount, 2, '.', '') . '</td>' . "\n";
            $output .= '<td class="number">' . number_format($sale->tax, 2, '.', '') . '</td>' . "\n";
            $output .= '<td class="number">' . number_format($sale->total, 2, '.', '') . '</td>' . "\n";
            $output .= '<td>' . htmlspecialchars($itemsDesc) . '</td>' . "\n";
            $output .= '</tr>' . "\n";
        }

        $output .= '</tbody>' . "\n";
        $output .= '</table>' . "\n";
        $output .= '</body>' . "\n";
        $output .= '</html>' . "\n";

        return response($output, 200, $headers);
    }
}
