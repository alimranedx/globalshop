<?php

namespace App\Providers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Modules\ProductCatalog\Observers\ProductImageObserver;
use App\Modules\ProductCatalog\Observers\ProductObserver;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define dynamic page-authorization gate
        Gate::define('view-page', function ($user, string $pageIdentifier) {
            if ($user->is_platform_admin) {
                return true;
            }

            $shop = TenantManager::getTenant();
            if ($shop && $shop->owner_id === $user->id) {
                return true;
            }

            $shopId = TenantManager::getTenantId();
            if (! $shopId) {
                return false;
            }

            $role = $user->getTenantRole($shopId);

            return $role ? $role->hasPageAccess($pageIdentifier) : false;
        });

        // Register Eloquent Observers
        Product::observe(ProductObserver::class);
        ProductImage::observe(ProductImageObserver::class);
    }
}
