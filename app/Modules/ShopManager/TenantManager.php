<?php

namespace App\Modules\ShopManager;

use App\Models\Shop;
use Illuminate\Support\Facades\Cache;

class TenantManager
{
    protected static ?Shop $tenant = null;

    /**
     * Set the currently active tenant shop.
     */
    public static function setTenant(?Shop $tenant): void
    {
        static::$tenant = $tenant;
    }

    /**
     * Retrieve the currently active tenant shop.
     */
    public static function getTenant(): ?Shop
    {
        return static::$tenant;
    }

    /**
     * Get the active tenant's ID.
     */
    public static function getTenantId(): ?string
    {
        return static::$tenant?->id;
    }

    /**
     * Check if a tenant scope is currently set.
     */
    public static function hasActiveTenant(): bool
    {
        return static::$tenant !== null;
    }

    /**
     * Get a cached subscription quota limit for the active tenant.
     */
    public static function getLimit(string $key, int $default = 0, $shopOrId = null): int
    {
        $shop = null;
        if ($shopOrId instanceof Shop) {
            $shop = $shopOrId;
        } elseif ($shopOrId) {
            $shop = Shop::find($shopOrId);
        }

        if (! $shop) {
            $shop = static::$tenant;
        }

        if (! $shop) {
            return $default;
        }

        try {
            return Cache::tags(["tenant:{$shop->id}", 'subscription'])->remember(
                "tenant:{$shop->id}:limit:{$key}",
                3600, // cache for 1 hour
                function () use ($shop, $key, $default) {
                    // Find active subscription
                    $subscription = $shop->activeSubscription;
                    if (! $subscription || ! $subscription->plan) {
                        return $default;
                    }

                    $limits = $subscription->plan->limits ?? [];

                    return $limits[$key] ?? $default;
                }
            );
        } catch (\BadMethodCallException $e) {
            // Fallback for cache stores that don't support tagging (like file/database)
            return Cache::remember(
                "tenant:{$shop->id}:limit:{$key}",
                3600,
                function () use ($shop, $key, $default) {
                    $subscription = $shop->activeSubscription;
                    if (! $subscription || ! $subscription->plan) {
                        return $default;
                    }

                    $limits = $subscription->plan->limits ?? [];

                    return $limits[$key] ?? $default;
                }
            );
        }
    }
}
