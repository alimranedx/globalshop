<?php

namespace App\Modules\ProductCatalog\Observers;

use App\Models\ProductImage;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Validation\ValidationException;

class ProductImageObserver
{
    /**
     * Handle the ProductImage "creating" event and enforce image upload limits.
     */
    public function creating(ProductImage $productImage): void
    {
        $shopId = $productImage->shop_id ?? TenantManager::getTenantId();

        if (! $shopId) {
            return;
        }

        // Count existing images for this product
        $currentCount = ProductImage::withoutGlobalScopes()
            ->where('product_id', $productImage->product_id)
            ->count();

        $limit = TenantManager::getLimit('max_images_per_product', 2);

        if ($currentCount >= $limit) {
            throw ValidationException::withMessages([
                'subscription' => ["The active subscription limit of {$limit} images per product has been reached."],
            ]);
        }
    }
}
