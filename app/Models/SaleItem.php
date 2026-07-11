<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name',
        'quantity',
        'refunded_qty',
        'price',
        'cost_price',
        'total',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'refunded_qty' => 'decimal:2',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Get the parent sale transaction.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the associated product database record.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
