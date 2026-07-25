<?php

namespace App\Modules\ShopManager\Middleware;

use App\Models\Shop;
use App\Modules\AuditLog\Actions\LogActivityAction;
use App\Modules\ShopManager\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureShopAccess
{
    /**
     * Handle an incoming request and enforce shop-context authorization.
     */
    public function handle(Request $request, Closure $next)
    {
        $shop = null;

        // 1. Try to resolve shop from route parameter {slug} or {shop}
        $slug = $request->route('slug') ?? $request->route('shop');
        if ($slug instanceof Shop) {
            $shop = $slug;
        } elseif (is_string($slug) && !empty($slug)) {
            $shop = Shop::where('slug', $slug)->first();
        }

        // 2. Fallback to header or session tenant if route does not specify slug
        if (!$shop && $request->hasHeader('X-Tenant-ID')) {
            $shop = Shop::find($request->header('X-Tenant-ID'));
        }

        if (!$shop && session()->has('mock_active_tenant_id')) {
            $shop = Shop::find(session('mock_active_tenant_id'));
        }

        // 3. Handle shop not found
        if (!$shop) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'message' => 'Shop context not found.'], 404);
            }
            abort(404, 'Shop not found.');
        }

        // 4. Check shop status
        if ($shop->status === 'suspended') {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'message' => 'This shop has been suspended.'], 403);
            }
            abort(403, 'This shop has been suspended by the platform administrator.');
        }

        $user = Auth::user();

        if ($shop->status === 'pending') {
            if (!$user || !$user->is_platform_admin) {
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json(['success' => false, 'message' => 'This shop is pending admin approval.'], 403);
                }
                abort(403, 'This shop is pending admin approval.');
            }
        }

        // 5. Establish active tenant scope
        TenantManager::setTenant($shop);
        session(['mock_active_tenant_id' => $shop->id, 'active_shop_slug' => $shop->slug]);

        // 6. Validate user authorization if user is authenticated
        if ($user) {
            if (!$user->belongsToShop($shop)) {
                // Log unauthorized access attempt
                try {
                    $logger = resolve(LogActivityAction::class);
                    $logger->execute(
                        'unauthorized_shop_access_attempt',
                        "User {$user->email} attempted unauthorized access to shop '{$shop->name}' ({$shop->slug}).",
                        null,
                        ['shop_id' => $shop->id, 'user_id' => $user->id, 'ip' => $request->ip()],
                        $shop->id,
                        $user->id
                    );
                } catch (\Throwable $e) {
                    // Ignore logging failure to avoid breaking security block
                }

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden: You are not authorized to access or manage this shop.'
                    ], 403);
                }

                abort(403, 'Forbidden: You are not authorized to access or manage this shop.');
            }
        }

        return $next($request);
    }
}
