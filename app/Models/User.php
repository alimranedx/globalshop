<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, HasUlids, Notifiable, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_platform_admin',
        'admin_permissions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_platform_admin' => 'boolean',
            'admin_permissions' => 'array',
        ];
    }

    /**
     * Shops owned by the user.
     */
    public function ownedShops(): HasMany
    {
        return $this->hasMany(Shop::class, 'owner_id');
    }

    /**
     * Shops where the user is an employee.
     */
    public function shops(): BelongsToMany
    {
        return $this->belongsToMany(Shop::class, 'shop_user')
            ->withPivot('role_id', 'status')
            ->withTimestamps();
    }

    /**
     * Get the user's role for a specific tenant shop.
     */
    public function getTenantRole(string $shopId): ?Role
    {
        $shopUser = \DB::table('shop_user')
            ->where('shop_id', $shopId)
            ->where('user_id', $this->id)
            ->where('status', 'active')
            ->first();

        if (! $shopUser) {
            return null;
        }

        return Role::find($shopUser->role_id);
    }

    /**
     * Check if a platform admin has explicit page-level permissions.
     */
    public function hasAdminPermission(string $pageIdentifier): bool
    {
        // Platform Admins with is_platform_admin must be explicitly assigned unless they are Super Admin
        if ($this->email === 'superadmin@marketplace.com') {
            return true; // Super Admin acts as root and has all permissions bypass
        }

        return is_array($this->admin_permissions) && in_array($pageIdentifier, $this->admin_permissions);
    }
}
