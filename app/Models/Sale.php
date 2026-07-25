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
        'customer_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'shipping_address',
        'subtotal',
        'discount',
        'tax',
        'total',
        'payment_method',
        'status',
        'refunded_amount',
        'created_by',
    ];

    /**
     * Get the shop (tenant) that owns this sale.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get the customer associated with this sale.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the refunds for this sale transaction.
     */
    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

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
