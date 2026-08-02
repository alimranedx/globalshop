<?php

use App\Modules\Authorization\Controllers\Api\RoleController;
use App\Modules\ProductCatalog\Controllers\Api\ProductController;
use App\Modules\ProductCatalog\Controllers\Api\CategoryController;
use App\Modules\ProductCatalog\Controllers\Api\BrandController;
use App\Modules\ShopManager\Controllers\Api\EmployeeController;
use App\Modules\ShopManager\Controllers\Api\RefundController;
use App\Modules\ShopManager\Controllers\Api\CustomerController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public Shop Discovery & Search Endpoint
    Route::get('/shops/search', [\App\Http\Controllers\ShopDiscoveryController::class, 'search'])->name('shops.search');

    // Shop-Aware Authentication Endpoints (Public)
    Route::post('/shop/{slug}/login', [\App\Http\Controllers\ShopAuthController::class, 'login'])->name('api.shop.login');
    Route::post('/shop/{slug}/register', [\App\Http\Controllers\ShopAuthController::class, 'register'])->name('api.shop.register');

    // Authentication Endpoints (Public)
    Route::post('/auth/register-owner', [AuthController::class, 'registerOwner'])->name('auth.register');
    Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');

    // Authenticated User Profile Endpoints
    Route::middleware('auth')->prefix('profile')->group(function () {
        Route::get('/', [\App\Http\Controllers\ProfileController::class, 'show'])->name('profile.show');
        Route::put('/', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
        Route::post('/avatar', [\App\Http\Controllers\ProfileController::class, 'uploadAvatar'])->name('profile.avatar.upload');
        Route::delete('/avatar', [\App\Http\Controllers\ProfileController::class, 'deleteAvatar'])->name('profile.avatar.delete');
    });


    // ──────────────────────────────────────────────────────
    // Marketplace Customer Auth (Public — phone OTP, session-based)
    // ──────────────────────────────────────────────────────
    Route::prefix('marketplace')->group(function () {
        Route::post('/login',      [\App\Http\Controllers\MarketplaceCustomerController::class, 'login'])->name('marketplace.login');
        Route::post('/register',   [\App\Http\Controllers\MarketplaceCustomerController::class, 'register'])->name('marketplace.register');
        Route::post('/send-otp',   [\App\Http\Controllers\MarketplaceCustomerController::class, 'sendOtp'])->name('marketplace.send-otp');
        Route::post('/verify-otp', [\App\Http\Controllers\MarketplaceCustomerController::class, 'verifyOtp'])->name('marketplace.verify-otp');
        Route::get('/me',          [\App\Http\Controllers\MarketplaceCustomerController::class, 'me'])->name('marketplace.me');
        Route::post('/profile',    [\App\Http\Controllers\MarketplaceCustomerController::class, 'updateProfile'])->name('marketplace.profile.update');
        Route::post('/shops',      [\App\Http\Controllers\MarketplaceCustomerController::class, 'updateShops'])->name('marketplace.update-shops');
        Route::post('/logout',     [\App\Http\Controllers\MarketplaceCustomerController::class, 'logout'])->name('marketplace.logout');
        Route::get('/shops/search',[\App\Http\Controllers\MarketplaceCustomerController::class, 'searchShops'])->name('marketplace.shops.search');
        Route::post('/checkout',   [\App\Http\Controllers\MarketplaceCustomerController::class, 'checkout'])->name('marketplace.checkout');
        Route::get('/orders',      [\App\Http\Controllers\MarketplaceCustomerController::class, 'getOrders'])->name('marketplace.orders.index');
        Route::get('/orders/{id}', [\App\Http\Controllers\MarketplaceCustomerController::class, 'getOrderDetail'])->name('marketplace.orders.show');
        Route::get('/orders/{id}/receipt', [\App\Http\Controllers\MarketplaceCustomerController::class, 'downloadReceipt'])->name('marketplace.orders.receipt');
    });

    // 1. Customer Endpoints (Public)
    Route::get('/products', [ProductController::class, 'index'])->name('public.products.index');
    Route::get('/products/{id}', [ProductController::class, 'show'])->name('public.products.show');
    Route::get('/shops/{shop_slug}/products', [ProductController::class, 'shopProducts'])->name('public.shop.products');

    // 2. Tenant Authenticated Endpoints (Requires ShopAccess authorization, standard auth, and page authorization)
    Route::middleware(['shop.access', 'auth', 'page.authorize'])->prefix('tenant')->group(function () {
        // Product Catalog Management
        Route::get('stock-units', [ProductController::class, 'stockUnits'])->name('stock-units.index');
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

        // Shop Settings Management
        Route::put('settings', [\App\Modules\ShopManager\Controllers\Api\ShopSettingsController::class, 'update'])->name('settings.update');

        // Dashboard Analytics
        Route::get('dashboard-stats', \App\Modules\ShopManager\Controllers\Api\DashboardStatsController::class)->name('dashboard.stats');

        // Sales Management
        Route::get('sales/export', [\App\Modules\ShopManager\Controllers\Api\SalesController::class, 'export'])->name('sales.export');
        Route::get('sales', [\App\Modules\ShopManager\Controllers\Api\SalesController::class, 'index'])->name('sales.index');
        Route::post('sales', [\App\Modules\ShopManager\Controllers\Api\SalesController::class, 'store'])->name('sales.create');

        // Refund Management
        Route::get('refunds', [RefundController::class, 'index'])->name('refunds.index');
        Route::get('refunds/customers', [RefundController::class, 'customers'])->name('refunds.customers');
        Route::get('refunds/{refund}', [RefundController::class, 'show'])->name('refunds.show');
        Route::get('sales/{sale}/refundable', [RefundController::class, 'refundable'])->name('sales.refundable');
        Route::post('sales/{sale}/refund', [RefundController::class, 'store'])->name('sales.refund');
        Route::post('refunds/{refund}/approve', [RefundController::class, 'approve'])->name('refunds.approve');
        Route::post('refunds/{refund}/cancel', [RefundController::class, 'cancel'])->name('refunds.cancel');

        // Customer Management
        Route::apiResource('customers', CustomerController::class)->only(['index', 'show', 'store', 'update']);
        Route::post('customers/{customer}/credit', [CustomerController::class, 'updateCredit'])->name('customers.credit');
    });

    // 3. Platform Admin Endpoints (Requires standard auth, page permissions, and optional API token auth)
    Route::middleware(['auth', 'page.authorize'])->prefix('platform')->group(function () {
        Route::get('/state', [App\Http\Controllers\PlatformAdminController::class, 'state'])->name('platform.state');
        Route::get('/shops', [App\Http\Controllers\PlatformAdminController::class, 'listShops'])->name('admin.shops');
        Route::post('/shops', [App\Http\Controllers\PlatformAdminController::class, 'storeShop'])->name('admin.shops');
        Route::get('/shops/{shop}', [App\Http\Controllers\PlatformAdminController::class, 'showShop'])->name('admin.shops');
        Route::put('/shops/{shop}', [App\Http\Controllers\PlatformAdminController::class, 'updateShop'])->name('admin.shops');
        Route::delete('/shops/{shop}', [App\Http\Controllers\PlatformAdminController::class, 'destroyShop'])->name('admin.shops');
        Route::post('/shops/{shop}/toggle-suspension', [App\Http\Controllers\PlatformAdminController::class, 'toggleSuspension'])->name('admin.shops');
        Route::post('/shops/{shop}/approve', [App\Http\Controllers\PlatformAdminController::class, 'approveShop'])->name('admin.shops');
        Route::post('/shops/{shop}/handover', [App\Http\Controllers\PlatformAdminController::class, 'updateHandover'])->name('admin.shops');
        Route::get('/users', [App\Http\Controllers\PlatformAdminController::class, 'listUsers'])->name('admin.shops');
        Route::post('/shops/{shop}/owner', [App\Http\Controllers\PlatformAdminController::class, 'assignOwner'])->name('admin.shops');

        // Shop Employees Management
        Route::get('/shops/{shop}/employees', [App\Http\Controllers\PlatformAdminController::class, 'listShopEmployees'])->name('admin.shops');
        Route::post('/shops/{shop}/employees', [App\Http\Controllers\PlatformAdminController::class, 'addShopEmployee'])->name('admin.shops');
        Route::put('/shops/{shop}/employees/{user}', [App\Http\Controllers\PlatformAdminController::class, 'updateShopEmployee'])->name('admin.shops');
        Route::delete('/shops/{shop}/employees/{user}', [App\Http\Controllers\PlatformAdminController::class, 'removeShopEmployee'])->name('admin.shops');

        // Shop Roles & Permissions Management
        Route::get('/shops/{shop}/roles', [App\Http\Controllers\PlatformAdminController::class, 'listShopRoles'])->name('admin.shops');
        Route::post('/shops/{shop}/roles', [App\Http\Controllers\PlatformAdminController::class, 'storeShopRole'])->name('admin.shops');
        Route::put('/shops/{shop}/roles/{role}', [App\Http\Controllers\PlatformAdminController::class, 'updateShopRole'])->name('admin.shops');
        Route::delete('/shops/{shop}/roles/{role}', [App\Http\Controllers\PlatformAdminController::class, 'destroyShopRole'])->name('admin.shops');
        Route::get('/shops/{shop}/roles/{role}/permissions', [App\Http\Controllers\PlatformAdminController::class, 'getShopRolePermissions'])->name('admin.shops');
        Route::put('/shops/{shop}/roles/{role}/permissions', [App\Http\Controllers\PlatformAdminController::class, 'syncShopRolePermissions'])->name('admin.shops');

        // Shop Products Management
        Route::get('/shops/{shop}/products', [App\Http\Controllers\PlatformAdminController::class, 'listShopProducts'])->name('admin.shops');
        Route::post('/shops/{shop}/products', [App\Http\Controllers\PlatformAdminController::class, 'storeShopProduct'])->name('admin.shops');
        Route::put('/shops/{shop}/products/{product}', [App\Http\Controllers\PlatformAdminController::class, 'updateShopProduct'])->name('admin.shops');
        Route::delete('/shops/{shop}/products/{product}', [App\Http\Controllers\PlatformAdminController::class, 'destroyShopProduct'])->name('admin.shops');

        // Shop Audit Logs
        Route::get('/shops/{shop}/logs', [App\Http\Controllers\PlatformAdminController::class, 'listShopLogs'])->name('admin.shops');

        Route::get('/plans', [App\Http\Controllers\PlatformAdminController::class, 'listPlans'])->name('admin.plans');
        Route::post('/plans', [App\Http\Controllers\PlatformAdminController::class, 'storePlan'])->name('admin.plans');
        Route::put('/plans/{plan}', [App\Http\Controllers\PlatformAdminController::class, 'updatePlan'])->name('admin.plans');

        Route::get('/admins', [App\Http\Controllers\PlatformAdminController::class, 'listAdmins'])->name('admin.admins');
        Route::post('/admins', [App\Http\Controllers\PlatformAdminController::class, 'storeAdmin'])->name('admin.admins');
        Route::put('/admins/{user}/permissions', [App\Http\Controllers\PlatformAdminController::class, 'updateAdminPermissions'])->name('admin.admins');

        Route::get('/logs', [App\Http\Controllers\PlatformAdminController::class, 'listLogs'])->name('admin.logs');

        // Admin User Directory
        Route::get('/directory/customers', [App\Http\Controllers\AdminUserDirectoryController::class, 'getCustomers'])->name('admin.customers');
        Route::put('/directory/customers/{customer}/status', [App\Http\Controllers\AdminUserDirectoryController::class, 'updateCustomerStatus'])->name('admin.customers');
        Route::post('/directory/customers/{customer}/reset-password', [App\Http\Controllers\AdminUserDirectoryController::class, 'resetCustomerPassword'])->name('admin.customers');

        Route::get('/directory/shop-owners', [App\Http\Controllers\AdminUserDirectoryController::class, 'getShopOwners'])->name('admin.shops');
        Route::get('/directory/employees', [App\Http\Controllers\AdminUserDirectoryController::class, 'getEmployees'])->name('admin.shops');
        Route::put('/directory/users/{user}/status', [App\Http\Controllers\AdminUserDirectoryController::class, 'updateUserStatus'])->name('admin.shops');
        Route::post('/directory/users/{user}/reset-password', [App\Http\Controllers\AdminUserDirectoryController::class, 'resetUserPassword'])->name('admin.shops');

        // Admin Support Tickets Management
        Route::get('/support-tickets', [App\Http\Controllers\AdminSupportTicketController::class, 'index'])->name('admin.tickets');
        Route::get('/support-tickets/{ticket}', [App\Http\Controllers\AdminSupportTicketController::class, 'show'])->name('admin.tickets');
        Route::post('/support-tickets/{ticket}/reply', [App\Http\Controllers\AdminSupportTicketController::class, 'reply'])->name('admin.tickets');
        Route::put('/support-tickets/{ticket}/status', [App\Http\Controllers\AdminSupportTicketController::class, 'updateStatus'])->name('admin.tickets');
    });
});

// Public Support Ticket Routes
Route::post('/v1/support/tickets/public', [App\Http\Controllers\SupportTicketController::class, 'createPublicTicket']);

// Authenticated & Session Support Ticket Routes
Route::prefix('v1/support')->group(function () {
    Route::post('/tickets', [App\Http\Controllers\SupportTicketController::class, 'createAuthTicket']);
    Route::get('/tickets', [App\Http\Controllers\SupportTicketController::class, 'getUserTickets']);
    Route::get('/tickets/{ticket}', [App\Http\Controllers\SupportTicketController::class, 'getUserTicketDetails']);
    Route::post('/tickets/{ticket}/reply', [App\Http\Controllers\SupportTicketController::class, 'replyUserTicket']);
});

