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
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|min:11|max:13',
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
                    'customer_id' => $request->input('customer_id'),
                    'customer_name' => $request->input('customer_name'),
                    'customer_phone' => $request->input('customer_phone'),
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

        if ($format === 'xls') {
            return $this->exportToXls($sales, $shop->name);
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
                'Status',
                'Refunded Amount',
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
                    ucfirst($sale->status),
                    number_format($sale->refunded_amount, 2, '.', ''),
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

    private function exportToXls($sales, $shopName)
    {
        $headers = [
            'Content-Type'        => 'application/vnd.ms-excel',
            'Content-Disposition' => 'attachment; filename="sales_export.xlsx"',
            'Cache-Control'       => 'max-age=0',
            'Pragma'              => 'public',
        ];

        // SpreadsheetML — opens in Excel without the "broken file" warning
        $xml  = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        $xml .= "<?mso-application progid=\"Excel.Sheet\"?>\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"';
        $xml .= ' xmlns:o="urn:schemas-microsoft-com:office:office"';
        $xml .= ' xmlns:x="urn:schemas-microsoft-com:office:excel"';
        $xml .= ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' . "\n";

        // Styles
        $xml .= '<Styles>' . "\n";
        $xml .= '<Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#6366F1" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>' . "\n";
        $xml .= '<Style ss:ID="Number"><NumberFormat ss:Format="0.00"/></Style>' . "\n";
        $xml .= '<Style ss:ID="Default"></Style>' . "\n";
        $xml .= '</Styles>' . "\n";

        $xml .= '<Worksheet ss:Name="Sales Report">' . "\n";
        $xml .= '<Table>' . "\n";

        // Column widths
        $colWidths = [130, 130, 100, 120, 160, 100, 100, 100, 80, 80, 60, 80, 220];
        foreach ($colWidths as $w) {
            $xml .= '<Column ss:Width="' . $w . '"/>' . "\n";
        }

        // Header row
        $headers_row = [
            'Invoice Number', 'Date', 'Cashier', 'Customer Name',
            'Customer Email', 'Payment Method', 'Status', 'Refunded Amount', 'Subtotal', 'Discount',
            'Tax', 'Total', 'Items Sold'
        ];
        $xml .= '<Row>' . "\n";
        foreach ($headers_row as $h) {
            $xml .= '<Cell ss:StyleID="Header"><Data ss:Type="String">' . htmlspecialchars($h, ENT_XML1) . '</Data></Cell>' . "\n";
        }
        $xml .= '</Row>' . "\n";

        // Data rows
        foreach ($sales as $sale) {
            $itemsDesc = $sale->items->map(function ($item) {
                return $item->product_name . ' (' . (float)$item->quantity . ' @ $' . number_format($item->price, 2) . ')';
            })->implode(', ');

            $xml .= '<Row>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">'  . htmlspecialchars($sale->invoice_number, ENT_XML1) . '</Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">'  . htmlspecialchars($sale->created_at->toDateTimeString(), ENT_XML1) . '</Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">'  . htmlspecialchars($sale->creator ? $sale->creator->name : 'N/A', ENT_XML1) . '</Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">'  . htmlspecialchars($sale->customer_name ?: 'N/A', ENT_XML1) . '</Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">'  . htmlspecialchars($sale->customer_email ?: 'N/A', ENT_XML1) . '</Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">'  . htmlspecialchars(ucfirst($sale->payment_method), ENT_XML1) . '</Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">'  . htmlspecialchars(ucfirst($sale->status), ENT_XML1) . '</Data></Cell>' . "\n";
            $xml .= '<Cell ss:StyleID="Number"><Data ss:Type="Number">' . number_format($sale->refunded_amount, 2, '.', '') . '</Data></Cell>' . "\n";
            $xml .= '<Cell ss:StyleID="Number"><Data ss:Type="Number">' . number_format($sale->subtotal, 2, '.', '') . '</Data></Cell>' . "\n";
            $xml .= '<Cell ss:StyleID="Number"><Data ss:Type="Number">' . number_format($sale->discount, 2, '.', '') . '</Data></Cell>' . "\n";
            $xml .= '<Cell ss:StyleID="Number"><Data ss:Type="Number">' . number_format($sale->tax, 2, '.', '') . '</Data></Cell>' . "\n";
            $xml .= '<Cell ss:StyleID="Number"><Data ss:Type="Number">' . number_format($sale->total, 2, '.', '') . '</Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">'  . htmlspecialchars($itemsDesc, ENT_XML1) . '</Data></Cell>' . "\n";
            $xml .= '</Row>' . "\n";
        }

        $xml .= '</Table>' . "\n";
        $xml .= '</Worksheet>' . "\n";
        $xml .= '</Workbook>' . "\n";

        return response($xml, 200, $headers);
    }
}
