<?php

namespace App\Models;

use App\Modules\ShopManager\TenantManager;
use App\Modules\ShopManager\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'shop_id',
        'parent_id',
        'global_category_id',
        'name',
        'slug',
        'logo_path',
    ];

    /**
     * Boot model to handle tenant scoping and subscription quota checks.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            $shopId = $model->shop_id ?? TenantManager::getTenantId();
            if ($shopId) {
                $currentCount = Category::withoutGlobalScopes()
                    ->where('shop_id', $shopId)
                    ->count();

                $limit = TenantManager::getLimit('max_categories', 50, $shopId);

                if ($currentCount >= $limit) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'subscription' => ["The active subscription category limit of {$limit} has been reached. Please upgrade your plan."],
                    ]);
                }
            }
        });
    }

    /**
     * Get the shop that created this category.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Parent category.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * Child categories.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * Map a local category to a global marketplace category.
     */
    public function globalCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'global_category_id');
    }

    /**
     * Products classified by this category.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
