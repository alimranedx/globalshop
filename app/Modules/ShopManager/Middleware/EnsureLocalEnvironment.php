<?php

namespace App\Modules\ShopManager\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLocalEnvironment
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!app()->environment('local') && !config('app.debug')) {
            abort(403, 'The easy-login feature is only available in local development mode.');
        }

        return $next($request);
    }
}
