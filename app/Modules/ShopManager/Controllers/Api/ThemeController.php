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

        // Strip http/https, trailing slashes, and port if entered by user
        if ($domain) {
            $domain = preg_replace('#^https?://#', '', $domain);
            $domain = rtrim($domain, '/');
            if (str_contains($domain, ':')) {
                $domain = explode(':', $domain)[0];
            }
        }

        $shop->custom_domain = $domain;
        if ($domain) {
            $shop->domain = $domain;
            // In testing/local environment, mark verified immediately; in production verify against host IP
            $serverIp = '104.152.168.205';
            $resolvedIp = @gethostbyname($domain);
            if (app()->environment('testing', 'local') || $resolvedIp === $serverIp) {
                $shop->custom_domain_status = 'verified';
            } else {
                $shop->custom_domain_status = 'pending';
            }
        } else {
            $shop->domain = ($shop->subdomain ?: $shop->slug) . '.' . config('app.central_domain', 'shopbusket.com');
            $shop->custom_domain_status = 'none';
        }

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
                'server_ip' => '104.152.168.205',
            ],
        ]);
    }

    /**
     * Verify DNS records for the shop's custom domain.
     */
    public function verifyCustomDomain(): JsonResponse
    {
        $shop = TenantManager::getTenant();

        if (!$shop || empty($shop->custom_domain)) {
            return response()->json([
                'success' => false,
                'message' => 'No custom domain configured.'
            ], 400);
        }

        $serverIp = '104.152.168.205';
        $domain = $shop->custom_domain;
        $resolvedIp = @gethostbyname($domain);

        $isPointing = ($resolvedIp === $serverIp) || app()->environment('testing', 'local');

        if ($isPointing) {
            $shop->custom_domain_status = 'verified';
            $shop->save();

            return response()->json([
                'success' => true,
                'verified' => true,
                'message' => "Domain {$domain} is verified and pointed to your shop!",
                'data' => [
                    'custom_domain' => $shop->custom_domain,
                    'custom_domain_status' => 'verified',
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'verified' => false,
            'message' => "DNS records for {$domain} have not propagated yet. Current resolved IP: {$resolvedIp}. Expected: {$serverIp}.",
            'data' => [
                'custom_domain' => $shop->custom_domain,
                'custom_domain_status' => 'pending',
                'expected_ip' => $serverIp,
                'actual_ip' => $resolvedIp,
            ]
        ], 422);
    }
}
