<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Shop;
use App\Models\User;
use App\Modules\AuditLog\Actions\LogActivityAction;
use App\Modules\ShopManager\Actions\RegisterShopAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\View\View;

class ShopAuthController extends Controller
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Display the shop public entry and authentication page (/shop/{slug}).
     */
    public function showEntry(Request $request, string $slug): View|RedirectResponse
    {
        $shop = Shop::where('slug', $slug)->first();

        if (!$shop) {
            abort(404, 'Shop not found');
        }

        $user = Auth::user();
        $isAuthorized = $user ? $user->belongsToShop($shop) : false;

        return view('shop.entry', [
            'shop' => $shop,
            'authenticatedUser' => $user,
            'isAuthorized' => $isAuthorized,
        ]);
    }

    /**
     * Handle shop-aware login (/shop/{slug}/login).
     */
    public function login(Request $request, string $slug): JsonResponse|RedirectResponse
    {
        $shop = Shop::where('slug', $slug)->first();

        if (!$shop) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'message' => 'Shop not found.'], 404);
            }
            abort(404, 'Shop not found.');
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors()
                ], 422);
            }
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            // Log failed login attempt
            $this->logger->execute(
                'auth.login_failed',
                "Failed login attempt for email '{$request->input('email')}' on shop '{$shop->name}'",
                null,
                ['email' => $request->input('email'), 'ip' => $request->ip()],
                $shop->id,
                null
            );

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'The provided credentials do not match our records.'
                ], 422);
            }

            return redirect()->back()->withErrors(['email' => 'The provided credentials do not match our records.'])->withInput();
        }

        $user = Auth::user();

        // Check if user belongs to this specific shop
        if (!$user->belongsToShop($shop)) {
            // Log unauthorized access attempt
            $this->logger->execute(
                'unauthorized_shop_access_attempt',
                "User '{$user->email}' attempted unauthorized login access to shop '{$shop->name}' ({$shop->slug})",
                null,
                ['user_id' => $user->id, 'shop_id' => $shop->id],
                $shop->id,
                $user->id
            );

            // Log out user as they are not authorized for this shop context
            Auth::logout();
            $request->session()->invalidate();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => "You are not authorized to access shop '{$shop->name}'. Please log in with an authorized account."
                ], 403);
            }

            return redirect()->back()->withErrors([
                'email' => "You are not authorized to access shop '{$shop->name}'."
            ])->withInput();
        }

        // Check if shop is pending approval or suspended
        if ($shop->status === 'pending' && !$user->is_platform_admin) {
            Auth::logout();
            $request->session()->invalidate();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'pending' => true,
                    'message' => "Shop '{$shop->name}' is currently pending platform administration approval. You will receive access once approved."
                ], 403);
            }

            return redirect()->back()->withErrors([
                'email' => "Shop '{$shop->name}' is currently pending platform administration approval."
            ])->withInput();
        }

        if ($shop->status === 'suspended' && !$user->is_platform_admin) {
            Auth::logout();
            $request->session()->invalidate();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'suspended' => true,
                    'message' => "Shop '{$shop->name}' is currently suspended. Please contact platform support."
                ], 403);
            }

            return redirect()->back()->withErrors([
                'email' => "Shop '{$shop->name}' is currently suspended."
            ])->withInput();
        }

        // Authentication & Authorization succeeded
        $request->session()->regenerate();
        session(['mock_active_tenant_id' => $shop->id, 'active_shop_slug' => $shop->slug]);
        TenantManager::setTenant($shop);

        // Log successful login
        $this->logger->execute(
            'auth.login_success',
            "User '{$user->email}' logged into shop '{$shop->name}' successfully.",
            null,
            ['user_id' => $user->id, 'shop_id' => $shop->id],
            $shop->id,
            $user->id
        );

        $dashboardUrl = url("/shop/{$shop->slug}/dashboard");

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => 'Logged in successfully.',
                'redirect_url' => $dashboardUrl,
                'csrf_token' => csrf_token(),
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_platform_admin' => $user->is_platform_admin,
                    'role' => $user->id === $shop->owner_id ? 'Owner' : ($user->getTenantRole($shop->id)?->name ?? 'Employee'),
                ],
                'shop' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                    'status' => $shop->status,
                ]
            ]);
        }

        return redirect()->to($dashboardUrl);
    }

    /**
     * Handle shop-aware registration (/shop/{slug}/register).
     */
    public function register(Request $request, string $slug): JsonResponse|RedirectResponse
    {
        $shop = Shop::where('slug', $slug)->first();

        if (!$shop) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'message' => 'Shop not found.'], 404);
            }
            abort(404, 'Shop not found.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors()
                ], 422);
            }
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $user = DB::transaction(function () use ($request, $shop) {
            $user = User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make($request->input('password')),
            ]);

            // Assign default Worker role for this shop
            $workerRole = Role::where('shop_id', $shop->id)->where('name', 'Worker')->first();
            if (!$workerRole) {
                $workerRole = Role::create([
                    'shop_id' => $shop->id,
                    'name' => 'Worker',
                    'is_custom' => false,
                ]);
            }

            DB::table('shop_user')->insert([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'role_id' => $workerRole->id,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();
        session(['mock_active_tenant_id' => $shop->id, 'active_shop_slug' => $shop->slug]);
        TenantManager::setTenant($shop);

        $this->logger->execute(
            'auth.user_registered',
            "New employee '{$user->name}' registered and joined shop '{$shop->name}'.",
            null,
            ['user_id' => $user->id, 'shop_id' => $shop->id],
            $shop->id,
            $user->id
        );

        $dashboardUrl = url("/shop/{$shop->slug}/dashboard");

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => 'Registration successful! You have joined ' . $shop->name,
                'redirect_url' => $dashboardUrl,
                'csrf_token' => csrf_token(),
            ], 201);
        }

        return redirect()->to($dashboardUrl);
    }
}
