<?php

namespace App\Modules\ProductCatalog\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Shop;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of products globally across all shops with filter support.
     */
    public function index(Request $request): JsonResponse
    {
        // Bypass active tenant scoping to perform global search
        $query = Product::withoutGlobalScope('tenant')
            ->where('status', 'published')
            ->with(['shop', 'category', 'brand']);

        // 1. Keyword search (name / description)
        if ($request->has('q')) {
            $search = $request->query('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // 2. Category filter
        if ($request->has('category')) {
            $category = $request->query('category');
            $query->whereHas('category', function ($q) use ($category) {
                $q->where('slug', $category)
                    ->orWhere('id', $category);
            });
        }

        // 3. Brand filter
        if ($request->has('brand')) {
            $brand = $request->query('brand');
            $query->whereHas('brand', function ($q) use ($brand) {
                $q->where('slug', $brand)
                    ->orWhere('id', $brand);
            });
        }

        // 4. Shop scope filter
        if ($request->has('shop_id')) {
            $query->where('shop_id', $request->query('shop_id'));
        }

        // 5. Sorting logic
        if ($request->has('sort')) {
            $sort = $request->query('sort');
            if ($sort === 'price_asc') {
                $query->orderBy('price', 'asc');
            } elseif ($sort === 'price_desc') {
                $query->orderBy('price', 'desc');
            } else {
                $query->orderBy('created_at', 'desc');
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $products = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Display products listing for a specific shop slug.
     */
    public function shopProducts(string $shopSlug): JsonResponse
    {
        $shop = Shop::where('slug', $shopSlug)->firstOrFail();

        // Get products without tenant scope, filtered by shop id
        $products = Product::withoutGlobalScope('tenant')
            ->where('shop_id', $shop->id)
            ->where('status', 'published')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|string',
            'brand_id' => 'nullable|string',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'status' => 'required|string|in:draft,published,archived',
        ]);

        $shop = TenantManager::getTenant();

        $product = new Product($validated);
        $product->shop_id = $shop->id;
        $product->slug = Str::slug($validated['name']);
        $product->created_by = $request->user()->id;
        $product->save();

        return response()->json([
            'success' => true,
            'data' => $product,
        ], 201);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|required|string',
            'brand_id' => 'nullable|string',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'status' => 'sometimes|required|string|in:draft,published,archived',
        ]);

        if (isset($validated['name'])) {
            $product->slug = Str::slug($validated['name']);
        }

        $product->updated_by = $request->user()->id;
        $product->update($validated);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }
}
