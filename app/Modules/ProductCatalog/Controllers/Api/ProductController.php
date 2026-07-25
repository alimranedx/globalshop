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
            ->with(['shop', 'category', 'brand', 'images']);

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

        $products->getCollection()->transform(function ($prod) {
            $prod->images->transform(function ($img) {
                $img->image_url = asset('storage/' . $img->path);
                return $img;
            });
            return $prod;
        });

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
     * Display a listing of products scoped to the active tenant.
     */
    public function tenantIndex(Request $request): JsonResponse
    {
        // Scoped automatically by BelongsToTenant scope
        $products = Product::with(['category', 'brand', 'images'])->get()->map(function ($prod) {
            $prod->images->map(function ($img) {
                $img->image_url = asset('storage/' . $img->path);
                return $img;
            });
            return $prod;
        });

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Display products listing for a specific shop slug.
     */
    public function shopProducts(string $shopSlug): JsonResponse
    {
        $shop = Shop::where('slug', $shopSlug)->firstOrFail();

        // Get products without tenant scope, filtered by shop id, latest first
        $products = Product::withoutGlobalScope('tenant')
            ->where('shop_id', $shop->id)
            ->where('status', 'published')
            ->with(['shop', 'category', 'brand', 'images'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($prod) {
                $prod->images->map(function ($img) {
                    $img->image_url = asset('storage/' . $img->path);
                    return $img;
                });
                return $prod;
            });

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
            'category_id' => 'required|integer|exists:categories,id',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|numeric|min:0',
            'stock_unit' => 'required|string|in:pcs,kg,ltr',
            'status' => 'required|string|in:draft,published,archived',
            'images' => 'nullable|array',
            'images.*' => 'image|max:2048',
        ]);

        if (!empty($validated['brand_id'])) {
            $brand = \App\Models\Brand::find($validated['brand_id']);
            if ($brand && $brand->category_id != $validated['category_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected brand is not associated with the selected category.',
                ], 422);
            }
        }

        $shop = TenantManager::getTenant();

        // Dynamic subscription images limit check
        $subscription = $shop->activeSubscription;
        $maxImages = 2;
        if ($subscription && $subscription->plan) {
            $limits = $subscription->plan->limits;
            $maxImages = $limits['max_images_per_product'] ?? 2;
        }

        $uploadFiles = $request->file('images') ?? [];
        if (count($uploadFiles) > $maxImages) {
            return response()->json([
                'success' => false,
                'message' => "Product image limit exceeded. Your plan allows a maximum of {$maxImages} images per product.",
            ], 422);
        }

        $product = new Product($validated);
        $product->shop_id = $shop->id;
        $product->slug = Str::slug($validated['name']);
        $product->created_by = $request->user()->id;
        $product->save();

        // Save uploaded images
        foreach ($uploadFiles as $index => $file) {
            $path = $file->store('products', 'public');
            $product->images()->create([
                'shop_id' => $shop->id,
                'path' => $path,
                'sort_order' => $index,
            ]);
        }

        // Reload product with images and append image_url
        $product->load('images');
        $product->images->map(function ($img) {
            $img->image_url = asset('storage/' . $img->path);
            return $img;
        });

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
            'category_id' => 'sometimes|required|integer|exists:categories,id',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'stock_quantity' => 'sometimes|required|numeric|min:0',
            'stock_unit' => 'sometimes|required|string|in:pcs,kg,ltr',
            'status' => 'sometimes|required|string|in:draft,published,archived',
            'images' => 'nullable|array',
            'images.*' => 'image|max:2048',
            'delete_image_ids' => 'nullable|array',
            'delete_image_ids.*' => 'integer',
        ]);

        $catId = $validated['category_id'] ?? $product->category_id;
        $brandId = array_key_exists('brand_id', $validated) ? $validated['brand_id'] : $product->brand_id;

        if (!empty($brandId)) {
            $brand = \App\Models\Brand::find($brandId);
            if ($brand && $brand->category_id != $catId) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected brand is not associated with the selected category.',
                ], 422);
            }
        }

        $shop = TenantManager::getTenant();

        // 1. Handle deletion of selected images
        if ($request->has('delete_image_ids')) {
            $deleteIds = $request->input('delete_image_ids');
            $imagesToDelete = $product->images()->whereIn('id', $deleteIds)->get();
            foreach ($imagesToDelete as $img) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }

        // 2. Dynamic subscription images limit check for the total images
        $subscription = $shop->activeSubscription;
        $maxImages = 2;
        if ($subscription && $subscription->plan) {
            $limits = $subscription->plan->limits;
            $maxImages = $limits['max_images_per_product'] ?? 2;
        }

        $currentCount = $product->images()->count();
        $newFiles = $request->file('images') ?? [];

        if (($currentCount + count($newFiles)) > $maxImages) {
            return response()->json([
                'success' => false,
                'message' => "Product image limit exceeded. Your plan allows a maximum of {$maxImages} images per product.",
            ], 422);
        }

        if (isset($validated['name'])) {
            $product->slug = Str::slug($validated['name']);
        }

        $product->updated_by = $request->user()->id;
        $product->update($validated);

        // 3. Save new images
        foreach ($newFiles as $index => $file) {
            $path = $file->store('products', 'public');
            $product->images()->create([
                'shop_id' => $shop->id,
                'path' => $path,
                'sort_order' => $currentCount + $index,
            ]);
        }

        // Reload images
        $product->load('images');
        $product->images->map(function ($img) {
            $img->image_url = asset('storage/' . $img->path);
            return $img;
        });

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

    /**
     * Display the specified product details publicly.
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::withoutGlobalScope('tenant')
            ->with(['shop', 'category', 'brand', 'images'])
            ->findOrFail($id);

        $product->images->map(function ($img) {
            $img->image_url = asset('storage/' . $img->path);
            return $img;
        });

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }
}
