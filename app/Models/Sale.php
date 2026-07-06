<?php

namespace App\Models;

use App\Modules\ShopManager\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'shop_id',
        'invoice_number',
        'customer_name',
        'customer_email',
        'subtotal',
        'discount',
        'tax',
        'total',
        'payment_method',
        'created_by',
    ];

    /**
     * Get the individual items of the sale transaction.
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Get the user who recorded the transaction.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
