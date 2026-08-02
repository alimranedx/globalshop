<?php

use App\Modules\Authorization\Middleware\AuthorizePageAccess;
use App\Modules\ShopManager\Middleware\ResolveTenant;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', // Ensure API routes are registered
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('*/login') || $request->is('*/register') || $request->is('login') || $request->is('register')) {
                return null;
            }
            if (preg_match('#^/shop/([^/]+)#', $request->getPathInfo(), $matches)) {
                return "/shop/{$matches[1]}/login";
            }
            return '/login';
        });
        $middleware->validateCsrfTokens(except: [
            'demo/*',
        ]);
        $middleware->prependToGroup('api', \App\Http\Middleware\ApiTokenAuthenticate::class);
        $middleware->prependToGroup('api', \Illuminate\Session\Middleware\StartSession::class);
        $middleware->prependToGroup('api', \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class);
        $middleware->prependToGroup('api', \Illuminate\Cookie\Middleware\EncryptCookies::class);
        $middleware->alias([
            'tenant.resolve' => ResolveTenant::class,
            'shop.access' => \App\Modules\ShopManager\Middleware\EnsureShopAccess::class,
            'page.authorize' => AuthorizePageAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
