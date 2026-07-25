<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shop extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'name',
        'slug',
        'domain',
        'status',
        'currency',
        'language',
    ];

    /**
     * Get the owner of the shop.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get all subscriptions for this shop.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get the active subscription.
     */
    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->where('status', 'active');
    }

    /**
     * Get all roles defined for this shop.
     */
    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }

    /**
     * Get all products owned by this shop.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get all categories managed by this shop.
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * Get all brands managed by this shop.
     */
    public function brands(): HasMany
    {
        return $this->hasMany(Brand::class);
    }

    /**
     * Get all employees of this shop.
     */
    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'shop_user')
            ->withPivot('role_id', 'status')
            ->withTimestamps();
    }

    /**
     * Generate a unique slug for a shop.
     */
    public static function generateUniqueSlug(string $name, ?int $ignoreShopId = null): string
    {
        $baseSlug = \Illuminate\Support\Str::slug($name);
        if (empty($baseSlug)) {
            $baseSlug = 'shop';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (static::where('slug', $slug)
            ->when($ignoreShopId, fn ($q) => $q->where('id', '!=', $ignoreShopId))
            ->exists()) {
            $counter++;
            $slug = "{$baseSlug}-{$counter}";
        }

        return $slug;
    }

    /**
     * Check if a user is a member or owner of this shop.
     */
    public function hasMember(User $user): bool
    {
        if ($user->is_platform_admin) {
            return true;
        }

        if ($this->owner_id === $user->id) {
            return true;
        }

        return \Illuminate\Support\Facades\DB::table('shop_user')
            ->where('shop_id', $this->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Get member role in this shop.
     */
    public function getMemberRole(User $user): ?Role
    {
        if ($this->owner_id === $user->id) {
            return Role::where('shop_id', $this->id)->where('name', 'Owner')->first();
        }

        return $user->getTenantRole($this->id);
    }
}
