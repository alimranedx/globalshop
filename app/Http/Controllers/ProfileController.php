<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Format user profile payload for JSON API response.
     */
    private function formatUserProfile(User $user, ?Shop $shop = null): array
    {
        // Resolve active tenant role name if in shop scope
        $roleName = 'User';
        if ($user->is_platform_admin) {
            $roleName = $user->email === 'superadmin@marketplace.com' ? 'Super Admin' : 'Admin';
        } elseif ($shop) {
            $roleName = ($user->id === $shop->owner_id) ? 'Owner' : ($user->getTenantRole($shop->id)?->name ?? 'Employee');
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'avatar_url' => $user->avatar ? asset('storage/' . $user->avatar) : null,
            'is_platform_admin' => (bool)$user->is_platform_admin,
            'status' => $user->status ?? 'active',
            'role' => $roleName,
            'shop' => $shop ? [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'status' => $shop->status,
            ] : null,
            'created_at' => $user->created_at instanceof \DateTimeInterface ? $user->created_at->toIso8601String() : (string)$user->created_at,
            'last_login_at' => $user->last_login_at instanceof \DateTimeInterface ? $user->last_login_at->toIso8601String() : (string)$user->last_login_at,
        ];
    }

    /**
     * Resolve current shop scope for request context.
     */
    private function resolveShop(Request $request, User $user): ?Shop
    {
        $tenantId = $request->header('X-Shop-Id') ?? $request->header('X-Tenant-ID') ?? session('mock_active_tenant_id');
        if ($tenantId) {
            $shop = Shop::find($tenantId);
            if ($shop && $user->belongsToShop($shop)) {
                return $shop;
            }
        }

        // Fallback to owned shop or assigned employee shop
        $shop = Shop::where('owner_id', $user->id)->first();
        if (!$shop) {
            $shopUser = \Illuminate\Support\Facades\DB::table('shop_user')->where('user_id', $user->id)->first();
            if ($shopUser) {
                $shop = Shop::find($shopUser->shop_id);
            }
        }

        return $shop;
    }

    /**
     * Display the authenticated user's profile.
     */
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = $this->resolveShop($request, $user);

        return response()->json([
            'success' => true,
            'data' => $this->formatUserProfile($user, $shop),
        ]);
    }

    /**
     * Update the authenticated user's personal profile (Name & Phone).
     * Protected system fields (email, role, shop_id, status, is_platform_admin) are strictly guarded.
     */
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        // Explicitly update only allowed self-service fields
        $user->name = trim($validated['name']);
        $user->phone = isset($validated['phone']) ? trim($validated['phone']) : null;
        $user->save();

        $shop = $this->resolveShop($request, $user);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $this->formatUserProfile($user, $shop),
        ]);
    }

    /**
     * Upload or update profile photo avatar.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:2048',
        ]);

        $file = $request->file('avatar');

        // Delete old avatar file from disk if exists
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Store new avatar in public storage
        $path = $file->store('avatars', 'public');
        $user->avatar = $path;
        $user->save();

        $shop = $this->resolveShop($request, $user);

        return response()->json([
            'success' => true,
            'message' => 'Profile photo updated successfully.',
            'data' => $this->formatUserProfile($user, $shop),
        ]);
    }

    /**
     * Remove profile photo avatar.
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->avatar = null;
        $user->save();

        $shop = $this->resolveShop($request, $user);

        return response()->json([
            'success' => true,
            'message' => 'Profile photo removed successfully.',
            'data' => $this->formatUserProfile($user, $shop),
        ]);
    }
}
