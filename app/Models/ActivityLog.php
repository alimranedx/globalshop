<?php

namespace App\Models;

use App\Modules\ShopManager\TenantManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory, HasUlids;

    public $incrementing = false;

    protected $keyType = 'string';

    // Disable standard updated_at since logs are immutable
    const UPDATED_AT = null;

    protected $fillable = [
        'shop_id',
        'user_id',
        'action',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'device_type',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    /**
     * Boot model to scope checks to tenant when tenant context exists.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (TenantManager::hasActiveTenant()) {
                $model->shop_id = $model->shop_id ?? TenantManager::getTenantId();
            }
        });

        static::addGlobalScope('tenant', function (Builder $builder) {
            if (TenantManager::hasActiveTenant()) {
                $builder->where($builder->getModel()->getTable().'.shop_id', TenantManager::getTenantId());
            }
        });
    }

    /**
     * Get the associated shop tenant.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get the executing user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
