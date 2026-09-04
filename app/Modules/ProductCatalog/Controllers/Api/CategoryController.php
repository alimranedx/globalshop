<?php

namespace App\Modules\ProductCatalog\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Display a listing of the categories scoped to the active tenant.
     */
    public function index(): JsonResponse
    {
        $categories = Category::with('parent')->get()->map(function ($cat) {
            $cat->logo_url = $cat->logo_path
                ? (\Illuminate\Support\Str::startsWith($cat->logo_path, ['http://', 'https://'])
                    ? $cat->logo_path
                    : (\Illuminate\Support\Str::startsWith($cat->logo_path, 'images/') ? asset($cat->logo_path) : asset('storage/' . $cat->logo_path)))
                : null;
            return $cat;
        });

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|max:2048',
        ]);

        $category = new Category();
        $category->name = $validated['name'];
        
        $slug = Str::slug($validated['name']);
        $shopId = \App\Modules\ShopManager\TenantManager::getTenantId();
        if (Category::where('shop_id', $shopId)->where('slug', $slug)->exists()) {
            $slug .= '-' . Str::lower(Str::random(4));
        }
        $category->slug = $slug;
        $category->shop_id = $shopId;

        if ($request->hasFile('logo')) {
            $category->logo_path = $request->file('logo')->store('logos', 'public');
        }

        $category->save();
        $category->logo_url = $category->logo_path
            ? (\Illuminate\Support\Str::startsWith($category->logo_path, ['http://', 'https://'])
                ? $category->logo_path
                : (\Illuminate\Support\Str::startsWith($category->logo_path, 'images/') ? asset($category->logo_path) : asset('storage/' . $category->logo_path)))
            : null;

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Category created successfully.',
        ], 201);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|max:2048',
        ]);

        $category->name = $validated['name'];
        $slug = Str::slug($validated['name']);
        $shopId = \App\Modules\ShopManager\TenantManager::getTenantId();
        if (Category::where('shop_id', $shopId)->where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
            $slug .= '-' . Str::lower(Str::random(4));
        }
        $category->slug = $slug;

        if ($request->hasFile('logo')) {
            $category->logo_path = $request->file('logo')->store('logos', 'public');
        }

        $category->save();
        $category->logo_url = $category->logo_path
            ? (\Illuminate\Support\Str::startsWith($category->logo_path, ['http://', 'https://'])
                ? $category->logo_path
                : (\Illuminate\Support\Str::startsWith($category->logo_path, 'images/') ? asset($category->logo_path) : asset('storage/' . $category->logo_path)))
            : null;

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Category updated successfully.',
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Category $category): JsonResponse
    {
        // Check if category has subcategories or products
        if ($category->children()->exists() || $category->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with associated subcategories or products.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
        ]);
    }
}
