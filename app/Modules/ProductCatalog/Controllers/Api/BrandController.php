<?php

namespace App\Modules\ProductCatalog\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    /**
     * Display a listing of the brands.
     */
    public function index(): JsonResponse
    {
        // Scoped automatically by BelongsToTenant scope
        $brands = Brand::with('category')->get()->map(function ($brand) {
            $brand->logo_url = $brand->logo_path ? asset('storage/' . $brand->logo_path) : null;
            return $brand;
        });

        return response()->json([
            'success' => true,
            'data' => $brands,
        ]);
    }

    /**
     * Store a newly created brand.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'logo' => 'nullable|image|max:2048',
        ]);

        $brand = new Brand();
        $brand->name = $validated['name'];
        
        $slug = Str::slug($validated['name']);
        $shopId = \App\Modules\ShopManager\TenantManager::getTenantId();
        if (Brand::where('shop_id', $shopId)->where('slug', $slug)->exists()) {
            $slug .= '-' . Str::lower(Str::random(4));
        }
        $brand->slug = $slug;
        $brand->category_id = $validated['category_id'] ?? null;

        if ($request->hasFile('logo')) {
            $brand->logo_path = $request->file('logo')->store('logos', 'public');
        }

        $brand->save();
        
        // Refresh with category relation
        $brand->load('category');
        $brand->logo_url = $brand->logo_path ? asset('storage/' . $brand->logo_path) : null;

        return response()->json([
            'success' => true,
            'data' => $brand,
            'message' => 'Brand created successfully.',
        ], 201);
    }

    /**
     * Update the specified brand.
     */
    public function update(Request $request, Brand $brand): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'logo' => 'nullable|image|max:2048',
        ]);

        $brand->name = $validated['name'];
        $brand->slug = Str::slug($validated['name']);
        $brand->category_id = $validated['category_id'] ?? null;

        if ($request->hasFile('logo')) {
            $brand->logo_path = $request->file('logo')->store('logos', 'public');
        }

        $brand->save();
        
        // Refresh with category relation
        $brand->load('category');
        $brand->logo_url = $brand->logo_path ? asset('storage/' . $brand->logo_path) : null;

        return response()->json([
            'success' => true,
            'data' => $brand,
            'message' => 'Brand updated successfully.',
        ]);
    }

    /**
     * Remove the specified brand.
     */
    public function destroy(Brand $brand): JsonResponse
    {
        // Check if brand has products
        if ($brand->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete brand with associated products.',
            ], 422);
        }

        $brand->delete();

        return response()->json([
            'success' => true,
            'message' => 'Brand deleted successfully.',
        ]);
    }
}
