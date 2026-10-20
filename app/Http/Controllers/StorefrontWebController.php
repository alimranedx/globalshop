<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Modules\ShopManager\Services\ThemeService;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class StorefrontWebController extends Controller
{
    protected ThemeService $themeService;

    public function __construct(ThemeService $themeService)
    {
        $this->themeService = $themeService;
    }

    /**
     * Resolve shop from host, subdomain, or slug.
     */
    protected function resolveShop(Request $request, ?string $slug = null, ?string $subdomain = null): ?Shop
    {
        $identifier = $subdomain ?: $slug ?: $request->route('subdomain') ?: $request->route('slug');
        if ($identifier) {
            $identifier = strtolower(trim($identifier));
            if (str_starts_with($identifier, 'www.')) {
                $identifier = substr($identifier, 4);
            }
            if (!empty($identifier) && !Shop::isReservedSubdomain($identifier)) {
                $shop = Shop::where('subdomain', $identifier)
                    ->orWhere('slug', $identifier)
                    ->first();
                if ($shop) {
                    return $shop;
                }
            }
            // Explicit identifier requested but not found in database
            return null;
        }

        // Try custom domain
        $shop = Shop::resolveCustomDomainShop($request->getHost());
        if ($shop) {
            return $shop;
        }

        $host = strtolower($request->getHost());

        // Try subdomain from host
        $baseDomains = array_filter([
            config('app.central_domain', 'shopbusket.com'),
            config('app.base_domain', 'globalshop.test'),
            'shopbusket.test',
            'localhost',
        ]);

        foreach ($baseDomains as $baseDomain) {
            $baseDomain = strtolower($baseDomain);
            if ($host !== $baseDomain && str_ends_with($host, '.' . $baseDomain)) {
                $sub = substr($host, 0, -(strlen($baseDomain) + 1));
                if (str_starts_with($sub, 'www.')) {
                    $sub = substr($sub, 4);
                }
                if (!empty($sub)) {
                    if (Shop::isReservedSubdomain($sub)) {
                        return null;
                    }
                    $shop = Shop::where('subdomain', $sub)->orWhere('slug', $sub)->first();
                    // Host has a specific tenant subdomain: return match or null (never fallback)
                    return $shop;
                }
            }
        }

        // Fallback only for central domain or local dev without subdomain
        if (TenantManager::hasActiveTenant()) {
            return TenantManager::getTenant();
        }

        if (session()->has('mock_active_tenant_id')) {
            return Shop::find(session('mock_active_tenant_id'));
        }

        return null;
    }

    /**
     * Render the dedicated public storefront for a tenant shop.
     */
    public function renderStorefront(Request $request, ?string $slug = null, ?string $subdomain = null): View
    {
        $shop = $this->resolveShop($request, $slug, $subdomain);

        if (!$shop) {
            abort(404, 'Storefront not found.');
        }

        if ($shop->status === 'suspended') {
            abort(403, 'This store is temporarily suspended by the platform administrator.');
        }

        // If an authenticated user does not belong to this shop, log them out cleanly
        if (Auth::check()) {
            $user = Auth::user();
            if (!$user->is_platform_admin && !$user->belongsToShop($shop) && $shop->owner_id !== $user->id) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                session()->forget(['mock_active_tenant_id', 'active_shop_slug']);
            }
        }

        TenantManager::setTenant($shop);

        // Allow live previewing themes via ?preview_theme=tech/grocery/boutique
        $previewTheme = $request->query('preview_theme');
        $themeSlug = ($previewTheme && $this->themeService->isValidTheme($previewTheme))
            ? $previewTheme
            : ($shop->theme_slug ?: 'default');

        $theme = $this->themeService->getTheme($themeSlug);
        $themeConfig = $this->themeService->getEffectiveConfig($shop);

        // If previewing another theme, blend that theme's defaults
        if ($previewTheme && isset($theme['default_config'])) {
            $themeConfig = array_replace_recursive($theme['default_config'], $shop->theme_config ?: []);
        }

        // Fetch strict shop-scoped categories
        $categories = Category::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->withCount(['products' => function ($q) use ($shop) {
                $q->withoutGlobalScopes()->where('shop_id', $shop->id)->where('status', 'published');
            }])
            ->get();

        // Fetch strict shop-scoped brands
        $brands = Brand::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->withCount(['products' => function ($q) use ($shop) {
                $q->withoutGlobalScopes()->where('shop_id', $shop->id)->where('status', 'published');
            }])
            ->get();

        // Fetch published products
        $products = Product::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('status', 'published')
            ->with(['images' => fn($q) => $q->orderBy('sort_order', 'asc'), 'category', 'brand'])
            ->orderBy('id', 'desc')
            ->take(50)
            ->get();

        // Fetch popular / top featured products for slider
        $popularProducts = Product::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('status', 'published')
            ->with(['images' => fn($q) => $q->orderBy('sort_order', 'asc'), 'category', 'brand'])
            ->orderBy('stock_quantity', 'desc')
            ->take(6)
            ->get();

        return view('storefront', compact('shop', 'theme', 'themeConfig', 'categories', 'brands', 'products', 'popularProducts'));
    }
}
