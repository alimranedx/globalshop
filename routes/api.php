<?php

use App\Modules\Authorization\Controllers\Api\RoleController;
use App\Modules\ProductCatalog\Controllers\Api\ProductController;
use App\Modules\ProductCatalog\Controllers\Api\CategoryController;
use App\Modules\ProductCatalog\Controllers\Api\BrandController;
use App\Modules\ShopManager\Controllers\Api\EmployeeController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Authentication Endpoints (Public)
    Route::post('/auth/register-owner', [AuthController::class, 'registerOwner'])->name('auth.register');
    Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

    // 1. Customer Endpoints (Public)
    Route::get('/products', [ProductController::class, 'index'])->name('public.products.index');
    Route::get('/shops/{shop_slug}/products', [ProductController::class, 'shopProducts'])->name('public.shop.products');

    // 2. Tenant Authenticated Endpoints (Requires ResolveTenant, standard auth, and optional API token auth)
    Route::middleware(['tenant.resolve', 'auth', 'page.authorize'])->prefix('tenant')->group(function () {
        // Product Catalog Management
        Route::get('products', [ProductController::class, 'tenantIndex'])->name('products.index');
        Route::apiResource('products', ProductController::class)->except(['index']);

        // Category Management
        Route::apiResource('categories', CategoryController::class);

        // Brand Management
        Route::apiResource('brands', BrandController::class);

        // Roles & Permissions management
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        Route::get('roles/{role}/permissions', [RoleController::class, 'permissionsTree'])->name('roles.show');
        Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->name('roles.update');

        // Employee Management
        Route::apiResource('employees', EmployeeController::class)->except(['show']);

        // Sales Management
        Route::get('sales', [\App\Modules\ShopManager\Controllers\Api\SalesController::class, 'index'])->name('sales.index');
        Route::post('sales', [\App\Modules\ShopManager\Controllers\Api\SalesController::class, 'store'])->name('sales.create');
    });

    // 3. Platform Admin Endpoints (Requires standard auth, page permissions, and optional API token auth)
    Route::middleware(['auth', 'page.authorize'])->prefix('platform')->group(function () {
        Route::get('/state', [App\Http\Controllers\PlatformAdminController::class, 'state'])->name('platform.state');
        Route::get('/shops', [App\Http\Controllers\PlatformAdminController::class, 'listShops'])->name('admin.shops');
        Route::post('/shops/{shop}/toggle-suspension', [App\Http\Controllers\PlatformAdminController::class, 'toggleSuspension'])->name('admin.shops');
        Route::post('/shops/{shop}/approve', [App\Http\Controllers\PlatformAdminController::class, 'approveShop'])->name('admin.shops');

        Route::get('/plans', [App\Http\Controllers\PlatformAdminController::class, 'listPlans'])->name('admin.plans');
        Route::post('/plans', [App\Http\Controllers\PlatformAdminController::class, 'storePlan'])->name('admin.plans');
        Route::put('/plans/{plan}', [App\Http\Controllers\PlatformAdminController::class, 'updatePlan'])->name('admin.plans');

        Route::get('/admins', [App\Http\Controllers\PlatformAdminController::class, 'listAdmins'])->name('admin.admins');
        Route::post('/admins', [App\Http\Controllers\PlatformAdminController::class, 'storeAdmin'])->name('admin.admins');
        Route::put('/admins/{user}/permissions', [App\Http\Controllers\PlatformAdminController::class, 'updateAdminPermissions'])->name('admin.admins');

        Route::get('/logs', [App\Http\Controllers\PlatformAdminController::class, 'listLogs'])->name('admin.logs');
    });
});
