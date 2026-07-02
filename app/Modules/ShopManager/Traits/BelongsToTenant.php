<?php

namespace App\Modules\ShopManager\Traits;

use App\Modules\ShopManager\TenantManager;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    /**
     * Boot the trait to automatically register query scopes and creation hooks.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Automatically inject current tenant's shop_id on creation
        static::creating(function ($model) {
            if (TenantManager::hasActiveTenant()) {
                $model->shop_id = $model->shop_id ?? TenantManager::getTenantId();
            }
        });

        // Automatically scope all database selects to the active tenant
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (TenantManager::hasActiveTenant()) {
                $builder->where($builder->getModel()->getTable().'.shop_id', TenantManager::getTenantId());
            }
        });
    }
}
