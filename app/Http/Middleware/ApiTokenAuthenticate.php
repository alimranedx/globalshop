<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuthenticate
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->hasHeader('Authorization')) {
            $header = $request->header('Authorization');
            if (preg_match('/Bearer\s(\S+)/i', $header, $matches)) {
                $token = $matches[1];

                // Resolve the user by email for simulation ease
                $user = User::where('email', $token)->first();

                if ($user) {
                    Auth::setUser($user);
                    $request->setUserResolver(fn () => $user);
                }
            }
        }

        return $next($request);
    }
}
