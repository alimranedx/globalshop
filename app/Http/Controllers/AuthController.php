<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\User;
use App\Modules\ShopManager\Actions\RegisterShopAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected RegisterShopAction $registerAction;

    public function __construct(RegisterShopAction $registerAction)
    {
        $this->registerAction = $registerAction;
    }

    /**
     * Handle public registration of a new shop owner (requires admin approval).
     */
    public function registerOwner(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'owner_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'shop_name' => 'required|string|max:255',
            'shop_slug' => 'required|string|alpha_dash|unique:shops,slug',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $shop = $this->registerAction->execute(
            [
                'name' => $request->input('shop_name'),
                'slug' => $request->input('shop_slug'),
            ],
            [
                'name' => $request->input('owner_name'),
                'email' => $request->input('email'),
                'password' => $request->input('password'),
            ],
            null, // Trial plan
            'pending' // Defaults to pending approval
        );

        return response()->json([
            'success' => true,
            'message' => 'Registration completed successfully! Your shop is pending platform administration approval.',
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'status' => $shop->status,
            ]
        ], 201);
    }

    /**
     * Handle user login.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $request->session()->regenerate();
            $user = Auth::user();

            // Resolve active tenant shop scope
            $shop = Shop::where('owner_id', $user->id)->first();
            if (! $shop) {
                $shopUser = \DB::table('shop_user')->where('user_id', $user->id)->first();
                if ($shopUser) {
                    $shop = Shop::find($shopUser->shop_id);
                }
            }

            if ($user->is_platform_admin && ! $shop) {
                session(['mock_active_tenant_id' => null]);
            } else {
                session(['mock_active_tenant_id' => $shop?->id]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logged in successfully.',
                'csrf_token' => csrf_token(),
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_platform_admin' => $user->is_platform_admin,
                    'role' => $shop ? ($user->id === $shop->owner_id ? 'Owner' : $user->getTenantRole($shop->id)?->name) : ($user->is_platform_admin ? ($user->email === 'superadmin@marketplace.com' ? 'Super Admin' : 'Admin') : 'Customer/Guest'),
                ],
                'shop' => $shop ? ['id' => $shop->id, 'name' => $shop->name, 'status' => $shop->status] : null,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'The provided credentials do not match our records.'
        ], 421);
    }

    /**
     * Handle logout.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        session(['mock_active_tenant_id' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
            'csrf_token' => csrf_token(),
        ]);
    }
}
