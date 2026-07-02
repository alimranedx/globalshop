<?php

namespace App\Models;

use App\Modules\ShopManager\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use BelongsToTenant, HasFactory, HasUlids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'shop_id',
        'name',
        'is_custom',
    ];

    protected function casts(): array
    {
        return [
            'is_custom' => 'boolean',
        ];
    }

    /**
     * Get the shop that defines this role.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get all permitted pages assigned to this role.
     */
    public function pages(): HasMany
    {
        return $this->hasMany(RolePage::class);
    }

    /**
     * Check if this role has permission to access a specific page.
     */
    public function hasPageAccess(string $pageIdentifier): bool
    {
        // Check if page identifier exists in pages relationship
        return $this->pages()->where('page_identifier', $pageIdentifier)->exists();
    }
}
