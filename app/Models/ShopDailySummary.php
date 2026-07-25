<?php

namespace App\Models;

use App\Modules\ShopManager\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopDailySummary extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'shop_id',
        'summary_date',
        'total_orders',
        'total_revenue',
        'total_cost',
        'total_profit',
        'total_discount',
        'total_tax',
    ];

    protected function casts(): array
    {
        return [
            'summary_date'   => 'date',
            'total_orders'   => 'integer',
            'total_revenue'  => 'float',
            'total_cost'     => 'float',
            'total_profit'   => 'float',
            'total_discount' => 'float',
            'total_tax'      => 'float',
        ];
    }

    /**
     * The shop this summary belongs to.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}
