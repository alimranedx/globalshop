<?php

use App\Modules\Authorization\Controllers\Api\RoleController;
use App\Modules\ProductCatalog\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // 1. Customer Endpoints (Public)
    Route::get('/products', [ProductController::class, 'index'])->name('public.products.index');
    Route::get('/shops/{shop_slug}/products', [ProductController::class, 'shopProducts'])->name('public.shop.products');

    // 2. Tenant Authenticated Endpoints (Requires ResolveTenant and standard auth)
    Route::middleware(['tenant.resolve', 'auth', 'page.authorize'])->prefix('tenant')->group(function () {
        // Product Catalog Management
        Route::apiResource('products', ProductController::class)->except(['index']);

        // Roles & Permissions management
        Route::get('roles/{role}/permissions', [RoleController::class, 'permissionsTree'])->name('roles.show');
        Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->name('roles.update');
    });

    // 3. Platform Admin Mock Endpoint (Requires standard auth and page permissions check)
    Route::middleware(['auth', 'page.authorize'])->get('/platform/shops', function () {
        return response()->json(['success' => true]);
    })->name('admin.shops');
});
