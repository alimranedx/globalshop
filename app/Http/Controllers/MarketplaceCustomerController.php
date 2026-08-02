<?php

namespace App\Http\Controllers;

use App\Models\MarketplaceCustomer;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Customer;
use App\Modules\AuditLog\Actions\LogActivityAction;
use App\Modules\ShopManager\Services\SalesSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class MarketplaceCustomerController extends Controller
{
    /**
     * Customer Login via Phone Number + Password.
     *
     * POST /api/v1/marketplace/login
     * Body: { phone, password }
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone'    => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $phone = preg_replace('/\s+/', '', $request->phone);
        $customer = MarketplaceCustomer::where('phone', $phone)->first();

        if (!$customer || !$customer->password || !Hash::check($request->password, $customer->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid phone number or password.',
            ], 422);
        }

        if ($customer->status && $customer->status !== 'active') {
            return response()->json([
                'success' => false,
                'account_suspended' => true,
                'message' => "Your account is currently {$customer->status}. Please contact support for assistance.",
            ], 403);
        }

        $customer->update(['last_login_at' => now()]);

        session(['marketplace_customer_id' => $customer->id]);
        $customer->load('preferredShops');

        return response()->json([
            'success'  => true,
            'message'  => 'Logged in successfully.',
            'customer' => [
                'id'               => $customer->id,
                'name'             => $customer->name,
                'phone'            => $customer->phone,
                'avatar'           => $customer->avatar,
                'shipping_address' => $customer->shipping_address,
                'preferred_shops'  => $customer->preferredShops->map(fn($s) => [
                    'id'   => $s->id,
                    'name' => $s->name,
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Customer Registration via Full Name, Phone Number, Password, Confirm Password.
     *
     * POST /api/v1/marketplace/register
     * Body: { name, phone, password, confirm_password }
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'             => 'required|string|max:255',
            'phone'            => 'required|string|min:10|max:20|unique:marketplace_customers,phone',
            'password'         => 'required|string|min:6',
            'confirm_password' => 'required|string|same:password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $phone = preg_replace('/\s+/', '', $request->phone);

        $customer = MarketplaceCustomer::create([
            'name'        => trim($request->name),
            'phone'       => $phone,
            'password'    => Hash::make($request->password),
            'verified_at' => now(),
        ]);

        session(['marketplace_customer_id' => $customer->id]);

        return response()->json([
            'success'  => true,
            'message'  => 'Account created successfully.',
            'customer' => [
                'id'               => $customer->id,
                'name'             => $customer->name,
                'phone'            => $customer->phone,
                'avatar'           => $customer->avatar,
                'shipping_address' => $customer->shipping_address,
                'preferred_shops'  => [],
            ],
        ], 201);
    }

    /**
     * Step 1: Send OTP to phone number.
     * Creates account if it doesn't exist yet, generates & stores OTP.
     *
     * POST /api/v1/marketplace/send-otp
     * Body: { phone: string }
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:10|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $phone = preg_replace('/\s+/', '', $request->phone); // strip spaces

        // Find or create the marketplace customer record
        $customer = MarketplaceCustomer::firstOrCreate(['phone' => $phone]);

        // Generate OTP (123456 in dev, random 6-digit in prod)
        $otp = $customer->generateOtp();

        // In production: send via SMS gateway here
        // SmsGateway::send($phone, "Your GlobalShop OTP is: {$otp}");

        $response = [
            'success' => true,
            'message' => 'OTP sent successfully.',
            'is_new'  => is_null($customer->verified_at), // whether this is a new account
        ];

        // In dev/debug mode, include OTP in response for easy testing
        if (app()->environment('local') || config('app.debug')) {
            $response['dev_otp']  = $otp;
            $response['dev_note'] = 'DEV MODE: OTP is always 123456';
        }

        return response()->json($response);
    }

    /**
     * Step 2 + 3: Verify OTP, set name, attach preferred shops.
     * Logs in the customer by storing their ID in session.
     *
     * POST /api/v1/marketplace/verify-otp
     * Body: { phone, otp, name (required if new), shop_ids[] (optional, max 5) }
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone'    => 'required|string|min:10|max:20',
            'otp'      => 'required|string|size:6',
            'name'     => 'nullable|string|max:255',
            'shop_ids' => 'nullable|array|max:5',
            'shop_ids.*' => 'integer|exists:shops,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $phone = preg_replace('/\s+/', '', $request->phone);

        $customer = MarketplaceCustomer::where('phone', $phone)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number not found. Please request an OTP first.',
            ], 404);
        }

        // Verify OTP
        if (!$customer->isOtpValid($request->otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP. Please try again.',
            ], 422);
        }

        // Mark as verified, set name if provided
        $updateData = [
            'otp'            => null,
            'otp_expires_at' => null,
            'verified_at'    => $customer->verified_at ?? now(),
        ];

        if ($request->filled('name')) {
            $updateData['name'] = $request->name;
        }

        $customer->update($updateData);

        // Sync preferred shops (max 5, validated above)
        if ($request->has('shop_ids') && is_array($request->shop_ids)) {
            $shopIds = array_slice(array_unique($request->shop_ids), 0, 5);

            // Only add new ones (don't remove existing preferences on initial verify)
            $existing = $customer->preferredShops()->pluck('shops.id')->toArray();
            $toAdd    = array_diff($shopIds, $existing);
            $allowed  = max(0, 5 - count($existing));

            if ($allowed > 0 && count($toAdd) > 0) {
                $customer->preferredShops()->attach(array_slice($toAdd, 0, $allowed));
            }
        }

        // Store customer session
        session(['marketplace_customer_id' => $customer->id]);

        $customer->load('preferredShops');

        return response()->json([
            'success'  => true,
            'message'  => 'Login successful!',
            'customer' => [
                'id'              => $customer->id,
                'name'            => $customer->name,
                'phone'           => $customer->phone,
                'preferred_shops' => $customer->preferredShops->map(fn($s) => [
                    'id'   => $s->id,
                    'name' => $s->name,
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Get current logged-in marketplace customer profile.
     *
     * GET /api/v1/marketplace/me
     */
    public function me(Request $request): JsonResponse
    {
        $customerId = session('marketplace_customer_id');

        if (!$customerId) {
            return response()->json([
                'success'  => false,
                'customer' => null,
            ]);
        }

        $customer = MarketplaceCustomer::with('preferredShops')->find($customerId);

        if (!$customer || !$customer->isVerified()) {
            session()->forget('marketplace_customer_id');
            return response()->json([
                'success'  => false,
                'customer' => null,
            ]);
        }

        return response()->json([
            'success'  => true,
            'customer' => [
                'id'               => $customer->id,
                'name'             => $customer->name,
                'phone'            => $customer->phone,
                'avatar'           => $customer->avatar,
                'shipping_address' => $customer->shipping_address,
                'preferred_shops'  => $customer->preferredShops->map(fn($s) => [
                    'id'   => $s->id,
                    'name' => $s->name,
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Update customer profile info (name, phone, shipping_address, avatar).
     *
     * POST /api/v1/marketplace/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $customerId = session('marketplace_customer_id');
        if (!$customerId) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $customer = MarketplaceCustomer::find($customerId);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer account not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'             => 'nullable|string|max:255',
            'phone'            => 'nullable|string|min:10|max:20|unique:marketplace_customers,phone,' . $customer->id,
            'shipping_address' => 'nullable|string|max:1000',
            'avatar'           => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $updateData = [];
        if ($request->has('name')) {
            $updateData['name'] = trim($request->name);
        }
        if ($request->has('phone') && $request->filled('phone')) {
            $updateData['phone'] = preg_replace('/\s+/', '', $request->phone);
        }
        if ($request->has('shipping_address')) {
            $updateData['shipping_address'] = trim($request->shipping_address);
        }
        if ($request->has('avatar')) {
            $updateData['avatar'] = trim($request->avatar);
        }

        if (!empty($updateData)) {
            $customer->update($updateData);
        }

        $customer->load('preferredShops');

        return response()->json([
            'success'  => true,
            'message'  => 'Profile updated successfully.',
            'customer' => [
                'id'               => $customer->id,
                'name'             => $customer->name,
                'phone'            => $customer->phone,
                'avatar'           => $customer->avatar,
                'shipping_address' => $customer->shipping_address,
                'preferred_shops'  => $customer->preferredShops->map(fn($s) => [
                    'id'   => $s->id,
                    'name' => $s->name,
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Get all orders belonging to the authenticated customer.
     *
     * GET /api/v1/marketplace/orders
     */
    public function getOrders(Request $request): JsonResponse
    {
        $customerId = session('marketplace_customer_id');
        if (!$customerId) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $customer = MarketplaceCustomer::find($customerId);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer account not found.'], 404);
        }

        $phone = preg_replace('/\s+/', '', $customer->phone);

        $query = Sale::withoutGlobalScope('tenant')
            ->with(['shop:id,name,slug', 'items.product:id,name'])
            ->where(function ($q) use ($customer, $phone) {
                $q->where('marketplace_customer_id', $customer->id);
                if ($phone) {
                    $q->orWhere('customer_phone', $phone)
                      ->orWhere('customer_phone', $customer->phone);
                }
            });

        if ($request->has('status') && in_array($request->status, ['pending', 'completed', 'cancelled'])) {
            $query->where('status', $request->status);
        }

        $sales = $query->orderBy('created_at', 'desc')->get();

        $formatted = $sales->map(function ($s) {
            return [
                'id'               => $s->id,
                'invoice_number'   => $s->invoice_number,
                'created_at'       => $s->created_at ? $s->created_at->toIso8601String() : null,
                'status'           => $s->status,
                'payment_method'   => $s->payment_method,
                'subtotal'         => (float) $s->subtotal,
                'discount'         => (float) $s->discount,
                'tax'              => (float) $s->tax,
                'total'            => (float) $s->total,
                'shipping_address' => $s->shipping_address,
                'customer_name'    => $s->customer_name,
                'customer_phone'   => $s->customer_phone,
                'shop'             => $s->shop ? [
                    'id'   => $s->shop->id,
                    'name' => $s->shop->name,
                    'slug' => $s->shop->slug,
                ] : null,
                'items'            => $s->items->map(fn($i) => [
                    'id'           => $i->id,
                    'product_id'   => $i->product_id,
                    'product_name' => $i->product_name,
                    'quantity'     => (float) $i->quantity,
                    'price'        => (float) $i->price,
                    'total'        => (float) $i->total,
                    'image'        => ($i->product && $i->product->images->first()) ? $i->product->images->first()->image_url : null,
                ]),
            ];
        });

        return response()->json([
            'success' => true,
            'orders'  => $formatted,
        ]);
    }

    /**
     * Get single order details with security check (only own orders).
     *
     * GET /api/v1/marketplace/orders/{id}
     */
    public function getOrderDetail(Request $request, $id): JsonResponse
    {
        $customerId = session('marketplace_customer_id');
        if (!$customerId) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $customer = MarketplaceCustomer::find($customerId);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer account not found.'], 404);
        }

        $phone = preg_replace('/\s+/', '', $customer->phone);

        $sale = Sale::withoutGlobalScope('tenant')
            ->with(['shop:id,name,slug', 'items.product:id,name'])
            ->where(function ($q) use ($customer, $phone) {
                $q->where('marketplace_customer_id', $customer->id);
                if ($phone) {
                    $q->orWhere('customer_phone', $phone)
                      ->orWhere('customer_phone', $customer->phone);
                }
            })
            ->where('id', $id)
            ->first();

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found or unauthorized access.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'order'   => [
                'id'               => $sale->id,
                'invoice_number'   => $sale->invoice_number,
                'created_at'       => $sale->created_at ? $sale->created_at->toIso8601String() : null,
                'status'           => $sale->status,
                'payment_method'   => $sale->payment_method,
                'subtotal'         => (float) $sale->subtotal,
                'discount'         => (float) $sale->discount,
                'tax'              => (float) $sale->tax,
                'total'            => (float) $sale->total,
                'shipping_address' => $sale->shipping_address,
                'customer_name'    => $sale->customer_name,
                'customer_phone'   => $sale->customer_phone,
                'shop'             => $sale->shop ? [
                    'id'   => $sale->shop->id,
                    'name' => $sale->shop->name,
                    'slug' => $sale->shop->slug,
                ] : null,
                'items'            => $sale->items->map(fn($i) => [
                    'id'           => $i->id,
                    'product_id'   => $i->product_id,
                    'product_name' => $i->product_name,
                    'quantity'     => (float) $i->quantity,
                    'price'        => (float) $i->price,
                    'total'        => (float) $i->total,
                    'image'        => ($i->product && $i->product->images->first()) ? $i->product->images->first()->image_url : null,
                ]),
            ],
        ]);
    }

    /**
     * Download PDF receipt for a customer order with security check.
     *
     * GET /api/v1/marketplace/orders/{id}/receipt
     */
    public function downloadReceipt(Request $request, $id)
    {
        $customerId = session('marketplace_customer_id');
        $customer = $customerId ? MarketplaceCustomer::find($customerId) : null;
        $phone = $customer ? preg_replace('/\s+/', '', $customer->phone) : null;

        $sale = Sale::withoutGlobalScope('tenant')
            ->with(['shop:id,name,slug', 'items.product:id,name'])
            ->where('id', $id)
            ->where(function ($q) use ($customer, $phone) {
                if ($customer) {
                    $q->where('marketplace_customer_id', $customer->id);
                    if ($phone) {
                        $q->orWhere('customer_phone', $phone)
                          ->orWhere('customer_phone', $customer->phone);
                    }
                }
            })
            ->first();

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found or unauthorized access.',
            ], 404);
        }

        $filename = "GlobalShop-Order-{$sale->invoice_number}-Receipt.pdf";

        // 1. Barryvdh DomPDF Facade (preferred)
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.receipt', [
                'sale' => $sale,
                'customer' => $customer,
            ]);
            return $pdf->download($filename);
        }

        // 2. Fallback using Dompdf directly
        $options = new \Dompdf\Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $dompdf = new \Dompdf\Dompdf($options);
        $html = view('pdf.receipt', ['sale' => $sale, 'customer' => $customer])->render();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response()->streamDownload(function () use ($dompdf) {
            echo $dompdf->output();
        }, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * Update preferred shops list (replace entire set, max 5).
     *
     * POST /api/v1/marketplace/shops
     * Body: { shop_ids: [1, 2, 3] }  — send empty array [] to clear all
     */
    public function updateShops(Request $request): JsonResponse
    {
        $customerId = session('marketplace_customer_id');
        if (!$customerId) {
            return response()->json(['success' => false, 'message' => 'Not authenticated.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'shop_ids'   => 'required|array|max:5',
            'shop_ids.*' => 'integer|exists:shops,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $customer = MarketplaceCustomer::find($customerId);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        // Enforce max 5 — take first 5
        $shopIds = array_slice(array_unique($request->shop_ids), 0, 5);

        // Sync replaces the entire set
        $syncData = [];
        foreach ($shopIds as $sid) {
            $syncData[$sid] = ['created_at' => now()];
        }
        $customer->preferredShops()->sync($shopIds);

        $customer->load('preferredShops');

        return response()->json([
            'success'         => true,
            'message'         => 'Preferred shops updated.',
            'preferred_shops' => $customer->preferredShops->map(fn($s) => [
                'id'   => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
            ]),
        ]);
    }

    /**
     * Log out the marketplace customer (clear session).
     *
     * POST /api/v1/marketplace/logout
     */
    public function logout(Request $request): JsonResponse
    {
        session()->forget('marketplace_customer_id');

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Search shops by name/slug for the registration shop picker.
     *
     * GET /api/v1/marketplace/shops?q=alpha
     */
    public function searchShops(Request $request): JsonResponse
    {
        $query = Shop::where('status', 'active');

        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $shops = $query->orderBy('name')->limit(20)->get(['id', 'name', 'slug', 'status']);

        return response()->json([
            'success' => true,
            'data'    => $shops,
        ]);
    }

    /**
     * Checkout from public marketplace. Split items by shop, decrease stock, log actions, record sale.
     */
    public function checkout(Request $request, LogActivityAction $logger, SalesSummaryService $summaryService): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|min:10|max:20',
            'customer_email' => 'nullable|email|max:255',
            'shipping_address' => 'required|string|max:1000',
            'payment_method' => 'required|string|in:cash,card,mobile',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        // Temporarily suspend active tenant context to prevent manager session bleeding into order creations
        $originalTenant = \App\Modules\ShopManager\TenantManager::getTenant();
        \App\Modules\ShopManager\TenantManager::setTenant(null);

        try {
            $invoicesCreated = [];

            DB::transaction(function () use ($request, $logger, $summaryService, &$invoicesCreated) {
                // 1. Group items by product shop_id
                $itemsByShop = [];
                foreach ($request->items as $itemData) {
                    $product = Product::withoutGlobalScope('tenant')->findOrFail($itemData['product_id']);
                    
                    // Validate stock level
                    if ($product->stock_quantity < $itemData['quantity']) {
                        throw new \Exception("Insufficient stock for product '{$product->name}'. Available: {$product->stock_quantity} {$product->stock_unit}.");
                    }

                    $itemsByShop[$product->shop_id][] = [
                        'product' => $product,
                        'quantity' => $itemData['quantity'],
                    ];
                }

                // 2. Process split checkout per shop
                foreach ($itemsByShop as $shopId => $items) {
                    $shop = Shop::findOrFail($shopId);
                    $subtotal = 0.00;
                    $itemsToCreate = [];

                    // Decrement stock and prepare items data
                    foreach ($items as $itm) {
                        $product = $itm['product'];
                        $qty = $itm['quantity'];

                        // Direct table decrement bypassing any Eloquent global scope checks
                        DB::table('products')->where('id', $product->id)->decrement('stock_quantity', $qty);

                        $itemTotal = round($product->price * $qty, 2);
                        $subtotal += $itemTotal;

                        $itemsToCreate[] = [
                            'product_id' => $product->id,
                            'product_name' => $product->name,
                            'quantity' => $qty,
                            'price' => $product->price,
                            'cost_price' => $product->cost_price ?? 0.00,
                            'total' => $itemTotal,
                        ];
                    }

                    $total = $subtotal; // no discounts or taxes pre-applied via public cart for simplicity

                    // Generate Invoice
                    $invoiceNumber = 'INV-MKT-' . strtoupper(Str::random(6)) . '-' . time();

                    // Find or create shop-scoped Customer profile bypassing tenant constraints so they save correctly
                    $shopCustomer = Customer::withoutGlobalScope('tenant')->firstOrCreate([
                        'shop_id' => $shopId,
                        'phone' => preg_replace('/\s+/', '', $request->customer_phone),
                    ], [
                        'name' => $request->customer_name,
                        'email' => $request->customer_email,
                        'membership_number' => 'MEM-MKT-' . strtoupper(Str::random(4)),
                        'store_credit_balance' => 0.00,
                    ]);

                    // Create the Sale record under the target shop context
                    $customerId = session('marketplace_customer_id');
                    $sale = Sale::create([
                        'shop_id' => $shopId,
                        'invoice_number' => $invoiceNumber,
                        'customer_id' => $shopCustomer->id,
                        'marketplace_customer_id' => $customerId ?: null,
                        'customer_name' => $request->customer_name,
                        'customer_phone' => $request->customer_phone,
                        'customer_email' => $request->customer_email,
                        'shipping_address' => $request->shipping_address,
                        'subtotal' => $subtotal,
                        'discount' => 0.00,
                        'tax' => 0.00,
                        'total' => $total,
                        'payment_method' => $request->payment_method,
                        'status' => 'completed', // completed order
                        'created_by' => $shop->owner_id, // Assigned to shop owner
                    ]);

                    // Create Sale Items
                    foreach ($itemsToCreate as $itmData) {
                        $sale->items()->create($itmData);
                    }

                    // Record to daily summaries metrics
                    $totalCost = collect($itemsToCreate)->sum(fn ($i) => round($i['cost_price'] * $i['quantity'], 2));
                    $summaryService->recordSale(
                        $shopId,
                        Carbon::now(),
                        $total,
                        $totalCost,
                        0.00,
                        0.00
                    );

                    // Log Activity log
                    $logger->execute(
                        'sale.created',
                        "New Marketplace Order split checked out. Invoice: {$invoiceNumber}. Total: $" . $total . ".",
                        null,
                        ['invoice' => $invoiceNumber, 'total' => $total, 'type' => 'marketplace'],
                        $shopId,
                        $shop->owner_id
                    );

                    $invoicesCreated[] = [
                        'id' => $sale->id,
                        'shop_name' => $shop->name,
                        'invoice_number' => $invoiceNumber,
                        'total' => $total,
                    ];
                }

                // If user is logged in, optionally save/update their shipping address
                $customerId = session('marketplace_customer_id');
                if ($customerId) {
                    $cust = MarketplaceCustomer::find($customerId);
                    if ($cust) {
                        $cust->update([
                            'shipping_address' => $request->shipping_address,
                            'name' => $cust->name ?? $request->customer_name
                        ]);
                    }
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully!',
                'orders' => $invoicesCreated,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } finally {
            // Restore tenant context
            \App\Modules\ShopManager\TenantManager::setTenant($originalTenant);
        }
    }
}

