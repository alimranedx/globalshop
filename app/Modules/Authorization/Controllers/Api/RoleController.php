<?php

namespace App\Modules\Authorization\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\RolePage;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * List all roles for the active tenant.
     */
    public function index(): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $roles = Role::where('shop_id', $shop->id)
            ->withCount(['pages'])
            ->get(['id', 'name', 'is_custom'])
            ->map(function ($role) use ($shop) {
                // Count employees assigned to each role
                $memberCount = DB::table('shop_user')
                    ->where('shop_id', $shop->id)
                    ->where('role_id', $role->id)
                    ->count();

                return [
                    'id'           => $role->id,
                    'name'         => $role->name,
                    'is_custom'    => (bool) $role->is_custom,
                    'member_count' => $memberCount,
                    'pages_count'  => $role->pages_count,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $roles,
        ]);
    }

    /**
     * Create a new custom role for the shop.
     */
    public function store(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        // Prevent duplicate role names per shop
        $exists = Role::where('shop_id', $shop->id)
            ->whereRaw('LOWER(name) = ?', [strtolower($request->name)])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => "A role named '{$request->name}' already exists in this shop.",
            ], 422);
        }

        $role = Role::create([
            'shop_id'   => $shop->id,
            'name'      => $request->name,
            'is_custom' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Role '{$role->name}' created successfully.",
            'data'    => [
                'id'           => $role->id,
                'name'         => $role->name,
                'is_custom'    => true,
                'member_count' => 0,
                'pages_count'  => 0,
            ],
        ], 201);
    }

    /**
     * Delete a custom role (only if no members are assigned).
     */
    public function destroy(Role $role): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $role->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Role not found in this shop.'], 404);
        }

        // Block deletion of built-in roles
        if (!$role->is_custom) {
            return response()->json([
                'success' => false,
                'message' => "Built-in role '{$role->name}' cannot be deleted.",
            ], 422);
        }

        // Check for assigned members
        $memberCount = DB::table('shop_user')
            ->where('shop_id', $shop->id)
            ->where('role_id', $role->id)
            ->count();

        if ($memberCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete '{$role->name}' — {$memberCount} employee(s) are still assigned to it. Re-assign them first.",
            ], 422);
        }

        $role->pages()->delete();
        $role->delete();

        return response()->json([
            'success' => true,
            'message' => "Role '{$role->name}' deleted successfully.",
        ]);
    }

    /**
     * Get the full permissions hierarchy tree and the active permission states for a role.
     */
    public function permissionsTree(Role $role): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $role->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Role not found in this shop.'], 404);
        }

        $permissionsConfig = config('permissions.modules', []);
        $checkedPages = $role->pages()->pluck('page_identifier')->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'role'          => ['id' => $role->id, 'name' => $role->name, 'is_custom' => (bool) $role->is_custom],
                'tree'          => $permissionsConfig,
                'checked_pages' => $checkedPages,
            ],
        ]);
    }

    /**
     * Synchronize permissions (pages list) for a specific shop role.
     */
    public function syncPermissions(Request $request, Role $role): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $role->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Role not found in this shop.'], 404);
        }

        $validated = $request->validate([
            'pages'   => 'required|array',
            'pages.*' => 'required|string',
        ]);

        DB::transaction(function () use ($role, $validated) {
            $role->pages()->delete();
            foreach ($validated['pages'] as $page) {
                RolePage::create([
                    'role_id'         => $role->id,
                    'page_identifier' => $page,
                ]);
            }
        });

        try {
            Cache::tags(["tenant:{$role->shop_id}", 'auth'])->flush();
        } catch (\BadMethodCallException $e) {
            // Fallback: cache tagging not supported by local driver
        }

        return response()->json([
            'success' => true,
            'message' => "Permissions for '{$role->name}' updated successfully.",
            'data' => [
                'role_id'      => $role->id,
                'synced_pages' => $role->pages()->pluck('page_identifier'),
            ],
        ]);
    }
}
