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
        'subdomain',
        'domain',
        'custom_domain',
        'custom_domain_status',
        'theme_slug',
        'theme_config',
        'status',
        'currency',
        'language',
        'logo_url',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'timezone',
        'refund_window_days',
    ];

    protected $casts = [
        'theme_config' => 'array',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::created(function (Shop $shop) {
            if (!empty($shop->subdomain)) {
                try {
                    resolve(\App\Services\CpanelSubdomainService::class)->createSubdomain($shop->subdomain);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Could not auto-create cPanel subdomain for shop {$shop->slug}: " . $e->getMessage());
                }
            }
        });

        static::deleted(function (Shop $shop) {
            if (!empty($shop->subdomain)) {
                try {
                    resolve(\App\Services\CpanelSubdomainService::class)->deleteSubdomain($shop->subdomain);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Could not auto-delete cPanel subdomain for shop {$shop->slug}: " . $e->getMessage());
                }
            }
        });

        static::restored(function (Shop $shop) {
            if (!empty($shop->subdomain)) {
                try {
                    resolve(\App\Services\CpanelSubdomainService::class)->createSubdomain($shop->subdomain);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Could not auto-restore cPanel subdomain for shop {$shop->slug}: " . $e->getMessage());
                }
            }
        });
    }

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
     * Reserved subdomains that cannot be assigned to tenant shops.
     *
     * @var array<string>
     */
    public static array $reservedSubdomains = [
        'www', 'admin', 'administrator', 'api', 'app', 'mail', 'cpanel', 'webmail',
        'shop', 'store', 'marketplace', 'portal', 'dev', 'staging', 'test', 'central',
        'root', 'public', 'assets', 'static', 'support', 'help', 'billing', 'auth'
    ];

    /**
     * Check if a given subdomain string is reserved.
     */
    public static function isReservedSubdomain(string $subdomain): bool
    {
        return in_array(strtolower(trim($subdomain)), static::$reservedSubdomains, true);
    }

    /**
     * Resolve a tenant shop matching a custom domain.
     */
    public static function resolveCustomDomainShop(?string $host): ?self
    {
        if (empty($host)) {
            return null;
        }

        $host = strtolower(trim($host));
        if (str_contains($host, ':')) {
            $host = explode(':', $host)[0];
        }

        $centralDomains = array_filter([
            config('app.central_domain', 'shopbusket.com'),
            config('app.base_domain', 'globalshop.test'),
            'shopbusket.test',
            'localhost',
            '127.0.0.1',
        ]);

        foreach ($centralDomains as $central) {
            $central = strtolower($central);
            if ($host === $central || str_ends_with($host, '.' . $central)) {
                return null;
            }
        }

        $shop = static::where('custom_domain', $host)
            ->orWhere('domain', $host)
            ->first();

        if ($shop) {
            return $shop;
        }

        if (str_starts_with($host, 'www.')) {
            $stripped = substr($host, 4);
            $shop = static::where('custom_domain', $stripped)
                ->orWhere('domain', $stripped)
                ->first();
            if ($shop) {
                return $shop;
            }
        } else {
            $withWww = 'www.' . $host;
            $shop = static::where('custom_domain', $withWww)
                ->orWhere('domain', $withWww)
                ->first();
            if ($shop) {
                return $shop;
            }
        }

        return null;
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

        if (static::isReservedSubdomain($baseSlug)) {
            $baseSlug = "{$baseSlug}-store";
        }

        $slug = $baseSlug;
        $counter = 1;

        while (static::where(function ($query) use ($slug) {
                $query->where('slug', $slug)->orWhere('subdomain', $slug);
            })
            ->when($ignoreShopId, fn ($q) => $q->where('id', '!=', $ignoreShopId))
            ->exists() || static::isReservedSubdomain($slug)) {
            $counter++;
            $slug = "{$baseSlug}-{$counter}";
        }

        return $slug;
    }

    /**
     * Get the tenant's full subdomain host (e.g. alpha.shopbusket.com or alpha.localhost).
     */
    public function getSubdomainHost(): string
    {
        $sub = $this->subdomain ?: $this->slug;
        $request = request();
        $currentHost = $request ? $request->getHost() : '';

        $baseDomains = array_filter([
            config('app.central_domain', 'shopbusket.com'),
            config('app.base_domain', 'globalshop.test'),
            'shopbusket.test',
            'localhost',
        ]);

        $matchedBase = config('app.central_domain', 'shopbusket.com');
        if ($currentHost) {
            foreach ($baseDomains as $baseDomain) {
                if ($currentHost === $baseDomain || str_ends_with($currentHost, '.' . $baseDomain)) {
                    $matchedBase = $baseDomain;
                    break;
                }
            }
        }

        return "{$sub}.{$matchedBase}";
    }

    /**
     * Get full subdomain URL for a given path.
     */
    public function getSubdomainUrl(string $path = ''): string
    {
        $host = $this->getSubdomainHost();
        $request = request();
        $scheme = $request ? $request->getScheme() : (config('app.force_https') ? 'https' : 'http');
        $port = $request ? $request->getPort() : null;
        $portSuffix = ($port && !in_array($port, [80, 443])) ? ":{$port}" : '';
        $path = ltrim($path, '/');

        return "{$scheme}://{$host}{$portSuffix}" . ($path !== '' ? "/{$path}" : '');
    }

    /**
     * Get primary URL for this shop (preferring custom_domain if configured).
     */
    public function getPrimaryUrl(string $path = ''): string
    {
        if (!empty($this->custom_domain)) {
            $request = request();
            $scheme = $request ? $request->getScheme() : (config('app.force_https') ? 'https' : 'http');
            $path = ltrim($path, '/');
            return "{$scheme}://{$this->custom_domain}" . ($path !== '' ? "/{$path}" : '');
        }

        return $this->getSubdomainUrl($path);
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
