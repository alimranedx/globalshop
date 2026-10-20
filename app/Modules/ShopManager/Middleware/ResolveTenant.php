<?php

namespace App\Modules\ShopManager\Middleware;

use App\Models\Shop;
use App\Modules\ShopManager\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    /**
     * Handle an incoming request and resolve the active tenant.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Platform admin management routes should never be blocked by tenant status checks
        if ($request->is('api/v1/platform/*') || $request->is('admin/*') || $request->is('admin')) {
            return $next($request);
        }

        $shop = null;

        // 1. Check for tenant header (useful for API testing/mobile apps)
        if ($request->hasHeader('X-Tenant-ID')) {
            $shop = Shop::where('id', $request->header('X-Tenant-ID'))->first();
        }

        // 2. Fallback: Parse host for subdomain (e.g., alpha.shopbusket.com, www.alpha.shopbusket.com, alpha.localhost)
        if (! $shop) {
            $host = strtolower($request->getHost());
            $baseDomains = array_filter([
                config('app.central_domain', 'shopbusket.com'),
                config('app.base_domain', 'globalshop.test'),
                'shopbusket.test',
                'localhost',
            ]);

            foreach ($baseDomains as $baseDomain) {
                $baseDomain = strtolower($baseDomain);
                if ($host !== $baseDomain && str_ends_with($host, '.' . $baseDomain)) {
                    $subdomain = substr($host, 0, -(strlen($baseDomain) + 1));
                    if (!empty($subdomain)) {
                        // Strip leading www. if present (e.g., www.alpha.shopbusket.com -> alpha)
                        if (str_starts_with($subdomain, 'www.')) {
                            $subdomain = substr($subdomain, 4);
                        }

                        if (!empty($subdomain) && !Shop::isReservedSubdomain($subdomain)) {
                            $shop = Shop::where('subdomain', $subdomain)
                                ->orWhere('slug', $subdomain)
                                ->first();
                            if ($shop) {
                                break;
                            }
                        }
                    }
                }
            }
        }

        // 3. Fallback: Check if there's a custom domain mapped
        if (! $shop) {
            $shop = Shop::resolveCustomDomainShop($request->getHost());
        }

        // 4. Fallback: Check route parameters {slug}, {subdomain}, or {shop}
        if (! $shop) {
            $routeIdentifier = $request->route('subdomain') ?? $request->route('slug') ?? $request->route('shop');
            if ($routeIdentifier instanceof Shop) {
                $shop = $routeIdentifier;
            } elseif (is_string($routeIdentifier) && !empty($routeIdentifier)) {
                $shop = Shop::where('subdomain', $routeIdentifier)
                    ->orWhere('slug', $routeIdentifier)
                    ->first();
            }
        }

        // 5. Fallback: Check session mock tenant ID (useful for direct downloads/API requests on localhost)
        if (! $shop && session()->has('mock_active_tenant_id')) {
            $shop = Shop::where('id', session('mock_active_tenant_id'))->first();
        }

        if ($shop) {
            $isPlatformAdmin = auth()->check() && auth()->user()->is_platform_admin;

            // Check if tenant is suspended
            if ($shop->status === 'suspended' && !$isPlatformAdmin) {
                abort(403, 'This shop has been suspended.');
            }

            // Check if tenant is pending approval
            if ($shop->status === 'pending' && !$isPlatformAdmin) {
                abort(403, 'This shop is pending admin approval.');
            }

            // Set global tenant context
            TenantManager::setTenant($shop);
        }

        return $next($request);
    }
}
