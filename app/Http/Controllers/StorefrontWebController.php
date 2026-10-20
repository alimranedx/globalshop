<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Modules\ShopManager\Services\ThemeService;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\Request;
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
    protected function resolveShop(Request $request, ?string $slug = null): ?Shop
    {
        if ($slug) {
            $shop = Shop::where('subdomain', $slug)
                ->orWhere('slug', $slug)
                ->first();
            if ($shop) {
                return $shop;
            }
        }

        // Try custom domain
        $host = $request->getHost();
        $shop = Shop::where('custom_domain', $host)
            ->orWhere('domain', $host)
            ->first();

        if ($shop) {
            return $shop;
        }

        // Try subdomain
        $baseDomains = array_filter([
            config('app.central_domain', 'shopbusket.com'),
            config('app.base_domain', 'globalshop.test'),
            'shopbusket.test',
            'localhost',
        ]);

        foreach ($baseDomains as $baseDomain) {
            if ($host !== $baseDomain && str_ends_with($host, '.' . $baseDomain)) {
                $sub = substr($host, 0, -(strlen($baseDomain) + 1));
                if (!empty($sub)) {
                    $shop = Shop::where('subdomain', $sub)->orWhere('slug', $sub)->first();
                    if ($shop) {
                        return $shop;
                    }
                }
            }
        }

        // Try active tenant from TenantManager or session
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
    public function renderStorefront(Request $request, ?string $slug = null): View
    {
        $shop = $this->resolveShop($request, $slug);

        if (!$shop) {
            // Default to Shop Alpha or first shop if in local/testing
            $shop = Shop::where('slug', 'alpha')->first() ?? Shop::first();
        }

        if (!$shop) {
            abort(404, 'Storefront not found.');
        }

        if ($shop->status === 'suspended') {
            abort(403, 'This store is temporarily suspended by the platform administrator.');
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
