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
     * Display a listing of the categories (tenant-specific + global).
     */
    public function index(): JsonResponse
    {
        // Hybrid global scope 'tenant_or_global' is automatically applied
        $categories = Category::with('parent')->get()->map(function ($cat) {
            $cat->logo_url = $cat->logo_path ? asset('storage/' . $cat->logo_path) : null;
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
        $category->slug = Str::slug($validated['name']);

        if ($request->hasFile('logo')) {
            $category->logo_path = $request->file('logo')->store('logos', 'public');
        }

        $category->save();
        $category->logo_url = $category->logo_path ? asset('storage/' . $category->logo_path) : null;

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
        // Prevent editing global categories by tenant admins
        if (is_null($category->shop_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Global categories cannot be modified.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|max:2048',
        ]);

        $category->name = $validated['name'];
        $category->slug = Str::slug($validated['name']);

        if ($request->hasFile('logo')) {
            $category->logo_path = $request->file('logo')->store('logos', 'public');
        }

        $category->save();
        $category->logo_url = $category->logo_path ? asset('storage/' . $category->logo_path) : null;

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
        // Prevent deleting global categories by tenant admins
        if (is_null($category->shop_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Global categories cannot be deleted.',
            ], 403);
        }

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
