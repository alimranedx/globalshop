<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Modules\ShopManager\Services\ThemeService;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StorefrontController extends Controller
{
    protected ThemeService $themeService;

    public function __construct(ThemeService $themeService)
    {
        $this->themeService = $themeService;
    }

    /**
     * Resolve shop from host, subdomain, slug, or header.
     */
    protected function resolveShop(Request $request, ?string $identifier = null): ?Shop
    {
        if (TenantManager::hasActiveTenant()) {
            return TenantManager::getTenant();
        }

        if ($identifier) {
            $shop = Shop::where('subdomain', $identifier)
                ->orWhere('slug', $identifier)
                ->first();
            if ($shop) {
                return $shop;
            }
        }

        // Try custom domain host detection
        $shop = Shop::resolveCustomDomainShop($request->getHost());
        if ($shop) {
            return $shop;
        }

        $host = $request->getHost();

        $baseDomains = array_filter([
            config('app.central_domain', 'shopbusket.com'),
            config('app.base_domain', 'globalshop.test'),
            'shopbusket.test',
            'localhost',
        ]);

        foreach ($baseDomains as $baseDomain) {
            if ($host !== $baseDomain && str_ends_with($host, '.' . $baseDomain)) {
                $sub = substr($host, 0, -(strlen($baseDomain) + 1));
                if (!empty($sub)) {
                    $shop = Shop::where('subdomain', $sub)->orWhere('slug', $sub)->first();
                    if ($shop) {
                        return $shop;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Get complete public storefront details for a shop.
     */
    public function show(Request $request, ?string $shopIdentifier = null): JsonResponse
    {
        $shop = $this->resolveShop($request, $shopIdentifier);

        if (!$shop) {
            return response()->json([
                'success' => false,
                'message' => 'Storefront not found.'
            ], 404);
        }

        if ($shop->status === 'suspended') {
            return response()->json([
                'success' => false,
                'message' => 'This store is temporarily unavailable.'
            ], 403);
        }

        $themeSlug = $shop->theme_slug ?: 'default';
        $themeMeta = $this->themeService->getTheme($themeSlug);
        $effectiveConfig = $this->themeService->getEffectiveConfig($shop);

        // Fetch Shop Categories (strict tenant scoped)
        $categories = Category::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->withCount(['products' => function ($q) use ($shop) {
                $q->withoutGlobalScopes()->where('shop_id', $shop->id)->where('status', 'published');
            }])
            ->get();

        // Fetch Shop Brands (strict tenant scoped)
        $brands = Brand::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->withCount(['products' => function ($q) use ($shop) {
                $q->withoutGlobalScopes()->where('shop_id', $shop->id)->where('status', 'published');
            }])
            ->get();

        // Fetch Published Products with images
        $products = Product::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('status', 'published')
            ->with(['images' => fn($q) => $q->orderBy('sort_order', 'asc'), 'category', 'brand'])
            ->orderBy('id', 'desc')
            ->take(24)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'shop' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                    'subdomain' => $shop->subdomain ?: $shop->slug,
                    'custom_domain' => $shop->custom_domain,
                    'currency' => $shop->currency ?: 'USD',
                    'logo_url' => $shop->logo_url,
                    'email' => $shop->email,
                    'phone' => $shop->phone,
                    'address' => $shop->address,
                    'city' => $shop->city,
                    'country' => $shop->country,
                ],
                'theme' => [
                    'slug' => $themeSlug,
                    'name' => $themeMeta['name'] ?? 'Modern Minimalist',
                    'tagline' => $themeMeta['tagline'] ?? '',
                    'category' => $themeMeta['category'] ?? '',
                    'config' => $effectiveConfig,
                ],
                'categories' => $categories,
                'brands' => $brands,
                'products' => $products,
            ],
        ]);
    }

    /**
     * Get paginated catalog products for the shop storefront with filters.
     */
    public function products(Request $request, ?string $shopIdentifier = null): JsonResponse
    {
        $shop = $this->resolveShop($request, $shopIdentifier);

        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Storefront not found.'], 404);
        }

        $query = Product::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('status', 'published')
            ->with(['images' => fn($q) => $q->orderBy('sort_order', 'asc'), 'category', 'brand']);

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Brand filter
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->input('brand_id'));
        }

        // Price range
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float)$request->input('min_price'));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float)$request->input('max_price'));
        }

        // Sorting
        $sort = $request->input('sort', 'latest');
        switch ($sort) {
            case 'price_low':
                $query->orderBy('price', 'asc');
                break;
            case 'price_high':
                $query->orderBy('price', 'desc');
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            default:
                $query->orderBy('id', 'desc');
                break;
        }

        $perPage = min((int)$request->input('per_page', 16), 50);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Get single product details on the shop storefront.
     */
    public function product(Request $request, string $productSlug, ?string $shopIdentifier = null): JsonResponse
    {
        $shop = $this->resolveShop($request, $shopIdentifier);

        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Storefront not found.'], 404);
        }

        $product = Product::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('slug', $productSlug)
            ->with(['images' => fn($q) => $q->orderBy('sort_order', 'asc'), 'category', 'brand'])
            ->first();

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found.'], 404);
        }

        // Related products in the same category
        $related = Product::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('status', 'published')
            ->with(['images' => fn($q) => $q->orderBy('sort_order', 'asc')])
            ->take(4)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'related_products' => $related,
            ],
        ]);
    }

    /**
     * Process direct public customer checkout on shop storefront.
     */
    public function checkout(Request $request, ?string $shopIdentifier = null): JsonResponse
    {
        $shop = $this->resolveShop($request, $shopIdentifier);

        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Storefront not found.'], 404);
        }

        $validated = $request->validate([
            'customer_name' => 'required|string|max:190',
            'customer_phone' => 'required|string|max:50',
            'shipping_address' => 'required|string|max:500',
            'payment_method' => 'nullable|string|in:cash,card',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($shop, $validated) {
            $totalAmount = 0.0;
            $saleItems = [];

            foreach ($validated['items'] as $itemData) {
                $product = Product::withoutGlobalScopes()
                    ->where('shop_id', $shop->id)
                    ->where('id', $itemData['product_id'])
                    ->lockForUpdate()
                    ->first();

                if (!$product) {
                    return response()->json([
                        'success' => false,
                        'message' => "Product ID {$itemData['product_id']} not found in this store."
                    ], 422);
                }

                if ($product->stock_quantity < $itemData['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock for '{$product->name}'. Available: {$product->stock_quantity}."
                    ], 422);
                }

                $itemPrice = (float) $product->price;
                $lineTotal = $itemPrice * $itemData['quantity'];
                $totalAmount += $lineTotal;

                // Decrement stock
                $product->decrement('stock_quantity', $itemData['quantity']);

                $saleItems[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $itemPrice,
                    'quantity' => $itemData['quantity'],
                    'total' => $lineTotal,
                ];
            }

            $invoiceNumber = 'INV-' . strtoupper(\Illuminate\Support\Str::random(8));

            $sale = \App\Models\Sale::create([
                'shop_id' => $shop->id,
                'created_by' => $shop->owner_id,
                'invoice_number' => $invoiceNumber,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'shipping_address' => $validated['shipping_address'],
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'subtotal' => $totalAmount,
                'discount' => 0.00,
                'total' => $totalAmount,
                'paid_amount' => $totalAmount,
                'change_amount' => 0.00,
                'sale_type' => 'online',
                'sale_date' => now(),
            ]);

            foreach ($saleItems as $sItem) {
                $sItem['sale_id'] = $sale->id;
                \App\Models\SaleItem::create($sItem);
            }

            return response()->json([
                'success' => true,
                'message' => 'Storefront order placed successfully!',
                'sale' => [
                    'id' => $sale->id,
                    'invoice_number' => $sale->invoice_number,
                    'total' => $sale->total,
                    'customer_name' => $sale->customer_name,
                ],
            ]);
        });
    }
}
