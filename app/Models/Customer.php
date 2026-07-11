<?php

namespace App\Models;

use App\Modules\ShopManager\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'shop_id',
        'name',
        'email',
        'phone',
        'membership_number',
        'store_credit_balance',
    ];

    protected $casts = [
        'store_credit_balance' => 'decimal:2',
    ];

    /**
     * Get all sales associated with this customer.
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
