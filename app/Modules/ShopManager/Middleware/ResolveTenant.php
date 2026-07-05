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
        $shop = null;

        // 1. Check for tenant header (useful for API testing/mobile apps)
        if ($request->hasHeader('X-Tenant-ID')) {
            $shop = Shop::where('id', $request->header('X-Tenant-ID'))->first();
        }

        // 2. Fallback: Parse host for subdomain (e.g., shop1.globalshop.test)
        if (! $shop) {
            $host = $request->getHost();
            $baseDomain = config('app.base_domain', 'globalshop.test'); // fallbacks to globalshop.test

            if ($host !== $baseDomain && str_ends_with($host, '.'.$baseDomain)) {
                $subdomain = str_replace('.'.$baseDomain, '', $host);
                $shop = Shop::where('slug', $subdomain)->first();
            }
        }

        // 3. Fallback: Check if there's a custom domain mapped
        if (! $shop) {
            $shop = Shop::where('domain', $request->getHost())->first();
        }

        if ($shop) {
            // Check if tenant is suspended
            if ($shop->status === 'suspended') {
                abort(403, 'This shop has been suspended.');
            }

            // Check if tenant is pending approval
            if ($shop->status === 'pending') {
                abort(403, 'This shop is pending admin approval.');
            }

            // Set global tenant context
            TenantManager::setTenant($shop);
        }

        return $next($request);
    }
}
