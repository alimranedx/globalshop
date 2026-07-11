<?php

namespace App\Models;

use App\Modules\ShopManager\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brand extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'shop_id',
        'category_id',
        'name',
        'slug',
        'logo_path',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            $shopId = $model->shop_id ?? \App\Modules\ShopManager\TenantManager::getTenantId();
            if ($shopId) {
                $currentCount = Brand::withoutGlobalScopes()
                    ->where('shop_id', $shopId)
                    ->count();

                $limit = \App\Modules\ShopManager\TenantManager::getLimit('max_brands', 50, $shopId);

                if ($currentCount >= $limit) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'subscription' => ["The active subscription brand limit of {$limit} has been reached. Please upgrade your plan."],
                    ]);
                }
            }
        });
    }

    /**
     * Get the category that this brand belongs to.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the shop that manages this brand.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Products supplied by this brand.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
