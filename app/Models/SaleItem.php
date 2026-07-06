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
        'price',
        'total',
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
