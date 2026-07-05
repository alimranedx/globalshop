<?php

namespace App\Models;

use App\Modules\ShopManager\TenantManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'parent_id',
        'global_category_id',
        'name',
        'slug',
        'logo_path',
    ];

    /**
     * Boot model to handle hybrid scoping (Global categories + Tenant-specific categories).
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (TenantManager::hasActiveTenant()) {
                $model->shop_id = $model->shop_id ?? TenantManager::getTenantId();
            }
        });

        static::addGlobalScope('tenant_or_global', function (Builder $builder) {
            if (TenantManager::hasActiveTenant()) {
                $builder->where(function ($query) {
                    $table = $query->getModel()->getTable();
                    $query->where($table.'.shop_id', TenantManager::getTenantId())
                        ->orWhereNull($table.'.shop_id');
                });
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
