<?php

namespace App\Modules\ProductCatalog\Observers;

use App\Models\Product;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Validation\ValidationException;

class ProductObserver
{
    /**
     * Handle the Product "creating" event and enforce product quotas.
     */
    public function creating(Product $product): void
    {
        $shopId = $product->shop_id ?? TenantManager::getTenantId();

        if (! $shopId) {
            return;
        }

        // Get product count in database without tenant scopes
        $currentCount = Product::withoutGlobalScopes()
            ->where('shop_id', $shopId)
            ->count();

        $limit = TenantManager::getLimit('max_products', 100);

        if ($currentCount >= $limit) {
            throw ValidationException::withMessages([
                'subscription' => ["The active subscription product limit of {$limit} has been reached. Please upgrade your plan."],
            ]);
        }
    }
}
