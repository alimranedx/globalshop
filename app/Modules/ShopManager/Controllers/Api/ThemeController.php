<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\ShopManager\Services\ThemeService;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ThemeController extends Controller
{
    protected ThemeService $themeService;

    public function __construct(ThemeService $themeService)
    {
        $this->themeService = $themeService;
    }

    /**
     * Get theme details for the active shop and list all available themes.
     */
    public function index(): JsonResponse
    {
        $shop = TenantManager::getTenant();

        if (!$shop) {
            return response()->json([
                'success' => false,
                'message' => 'No active tenant shop context found.'
            ], 404);
        }

        $allThemes = $this->themeService->getAllThemes();
        $currentThemeSlug = $shop->theme_slug ?: 'default';
        $currentThemeMeta = $this->themeService->getTheme($currentThemeSlug);
        $effectiveConfig = $this->themeService->getEffectiveConfig($shop);

        return response()->json([
            'success' => true,
            'data' => [
                'current_theme' => [
                    'slug' => $currentThemeSlug,
                    'name' => $currentThemeMeta['name'] ?? 'Modern Minimalist',
                    'category' => $currentThemeMeta['category'] ?? 'General',
                    'preview_image' => $currentThemeMeta['preview_image'] ?? null,
                    'config' => $effectiveConfig,
                ],
                'available_themes' => array_values($allThemes),
                'shop' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'subdomain' => $shop->subdomain ?: $shop->slug,
                    'custom_domain' => $shop->custom_domain,
                    'custom_domain_status' => $shop->custom_domain_status,
                ],
            ],
        ]);
    }

    /**
     * Update the active theme and theme configuration for the shop.
     */
    public function update(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();

        if (!$shop) {
            return response()->json([
                'success' => false,
                'message' => 'No active tenant shop context found.'
            ], 404);
        }

        $validated = $request->validate([
            'theme_slug' => 'nullable|string',
            'theme_config' => 'nullable|array',
            'theme_config.colors' => 'nullable|array',
            'theme_config.typography' => 'nullable|array',
            'theme_config.announcement' => 'nullable|array',
            'theme_config.hero' => 'nullable|array',
            'theme_config.sections' => 'nullable|array',
        ]);

        $themeSlug = $validated['theme_slug'] ?? $shop->theme_slug ?: 'default';
        $customConfig = $validated['theme_config'] ?? null;

        $shop = $this->themeService->applyTheme($shop, $themeSlug, $customConfig);

        return response()->json([
            'success' => true,
            'message' => 'Theme updated successfully.',
            'data' => [
                'theme_slug' => $shop->theme_slug,
                'theme_config' => $this->themeService->getEffectiveConfig($shop),
            ],
        ]);
    }

    /**
     * Update or register custom domain for the shop.
     */
    public function updateCustomDomain(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();

        if (!$shop) {
            return response()->json([
                'success' => false,
                'message' => 'No active tenant shop context found.'
            ], 404);
        }

        $validated = $request->validate([
            'custom_domain' => 'nullable|string|max:190|unique:shops,custom_domain,' . $shop->id,
        ]);

        $domain = $validated['custom_domain'] ? Str::lower(trim($validated['custom_domain'])) : null;

        // Strip http/https and trailing slashes if entered by user
        if ($domain) {
            $domain = preg_replace('#^https?://#', '', $domain);
            $domain = rtrim($domain, '/');
        }

        $shop->custom_domain = $domain;
        // In local/testing environment, mark as verified immediately; in production, mark pending DNS check
        $shop->custom_domain_status = $domain ? (app()->environment('production') ? 'pending' : 'verified') : 'none';
        $shop->save();

        return response()->json([
            'success' => true,
            'message' => $domain
                ? 'Custom domain configured successfully. Point your CNAME record to ' . config('app.central_domain', 'shopbusket.com')
                : 'Custom domain cleared.',
            'data' => [
                'custom_domain' => $shop->custom_domain,
                'custom_domain_status' => $shop->custom_domain_status,
                'cname_target' => config('app.central_domain', 'shopbusket.com'),
            ],
        ]);
    }
}
