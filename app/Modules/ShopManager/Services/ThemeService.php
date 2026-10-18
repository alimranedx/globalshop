<?php

namespace App\Modules\ShopManager\Services;

use App\Models\Shop;
use Illuminate\Support\Arr;

class ThemeService
{
    /**
     * Get all registered storefront themes.
     */
    public function getAllThemes(): array
    {
        return config('themes.themes', []);
    }

    /**
     * Get a single theme definition by slug.
     */
    public function getTheme(string $slug): array
    {
        $themes = $this->getAllThemes();
        return $themes[$slug] ?? $themes['default'] ?? [];
    }

    /**
     * Check if a theme slug is registered and valid.
     */
    public function isValidTheme(string $slug): bool
    {
        $themes = $this->getAllThemes();
        return isset($themes[$slug]);
    }

    /**
     * Resolve effective theme configuration for a given shop.
     * Merges the theme's base defaults with any custom overrides saved on the shop.
     */
    public function getEffectiveConfig(Shop $shop): array
    {
        $slug = $shop->theme_slug ?: 'default';
        $theme = $this->getTheme($slug);
        $defaults = $theme['default_config'] ?? [];
        $overrides = $shop->theme_config ?: [];

        return array_replace_recursive($defaults, $overrides);
    }

    /**
     * Apply a new theme and custom configuration to a shop.
     */
    public function applyTheme(Shop $shop, string $themeSlug, ?array $customConfig = null): Shop
    {
        if (!$this->isValidTheme($themeSlug)) {
            $themeSlug = 'default';
        }

        $shop->theme_slug = $themeSlug;

        if ($customConfig !== null) {
            // Merge with existing config
            $currentConfig = $shop->theme_config ?: [];
            $shop->theme_config = array_replace_recursive($currentConfig, $customConfig);
        }

        $shop->save();

        return $shop;
    }
}
