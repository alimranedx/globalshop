<?php

namespace App\Modules\Authorization\Middleware;

use App\Modules\ShopManager\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthorizePageAccess
{
    /**
     * Handle an incoming request and check if user has page-level access.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $routeName = $request->route()?->getName();
        $normalizedPage = $this->getNormalizedPageName($routeName);

        // 1. Bypass check if normalized route is not protected or mapped in config/permissions.php
        if (! $normalizedPage || ! $this->isProtectedPage($normalizedPage)) {
            return $next($request);
        }

        $user = $request->user();

        // 2. Unauthenticated requests are blocked for protected pages
        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        // 3. Handle Platform Administrative Pages (starting with "admin.")
        if (str_starts_with($normalizedPage, 'admin.')) {
            if (! $user->is_platform_admin) {
                abort(403, 'Platform administrative access required.');
            }

            if (! $user->hasAdminPermission($normalizedPage)) {
                abort(403, 'Unauthorized administrative access to page: '.$normalizedPage);
            }

            return $next($request);
        }

        // 4. Platform Admins bypass all shop-level page checks
        if ($user->is_platform_admin) {
            return $next($request);
        }

        // 5. Shop Owners bypass all checks for their own shop
        if ($this->isShopOwner($request)) {
            return $next($request);
        }

        // 6. Check if user is employee and has assigned role with access
        $shopId = TenantManager::getTenantId();
        if (! $shopId) {
            abort(403, 'No active tenant scope.');
        }

        $employeeRole = $user->getTenantRole($shopId);

        if (! $employeeRole || ! $employeeRole->hasPageAccess($normalizedPage)) {
            abort(403, 'Unauthorized access to page: '.$normalizedPage);
        }

        return $next($request);
    }

    /**
     * Normalize standard CRUD method suffixes to the main page index route name.
     */
    protected function getNormalizedPageName(?string $routeName): ?string
    {
        if (! $routeName) {
            return null;
        }

        $actions = ['.store', '.create', '.edit', '.update', '.destroy', '.show'];
        foreach ($actions as $action) {
            if (str_ends_with($routeName, $action)) {
                return str_replace($action, '.index', $routeName);
            }
        }

        return $routeName;
    }

    /**
     * Determine if a route page is mapped in the system configuration.
     */
    protected function isProtectedPage(string $routeName): bool
    {
        // Check shop modules config
        $modules = config('permissions.modules', []);
        foreach ($modules as $module) {
            foreach ($module['sub_modules'] as $subModule) {
                if (array_key_exists($routeName, $subModule['pages'])) {
                    return true;
                }
            }
        }

        // Check platform admin modules config
        $platformAdmin = config('permissions.platform_admin', []);
        if (isset($platformAdmin['sub_modules'])) {
            foreach ($platformAdmin['sub_modules'] as $subModule) {
                if (array_key_exists($routeName, $subModule['pages'])) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Determine if the user is the owner of the active tenant.
     */
    protected function isShopOwner(Request $request): bool
    {
        $shop = TenantManager::getTenant();

        return $shop && $shop->owner_id === $request->user()?->id;
    }
}
