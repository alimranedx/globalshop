<?php

namespace App\Modules\Authorization\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\RolePage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    /**
     * Get the full permissions hierarchy tree and the active permission states for a role.
     */
    public function permissionsTree(Role $role): JsonResponse
    {
        $permissionsConfig = config('permissions.modules', []);

        // Retrieve checked page identifiers for this role
        $checkedPages = $role->pages()->pluck('page_identifier')->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'tree' => $permissionsConfig,
                'checked_pages' => $checkedPages,
            ],
        ]);
    }

    /**
     * Synchronize permissions (pages list) for a specific shop role.
     */
    public function syncPermissions(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'pages' => 'required|array',
            'pages.*' => 'required|string',
        ]);

        DB::transaction(function () use ($role, $validated) {
            // Delete existing role permissions
            $role->pages()->delete();

            // Insert new mappings
            foreach ($validated['pages'] as $page) {
                RolePage::create([
                    'role_id' => $role->id,
                    'page_identifier' => $page,
                ]);
            }
        });

        // Flush cached role permissions
        try {
            Cache::tags(["tenant:{$role->shop_id}", 'auth'])->flush();
        } catch (\BadMethodCallException $e) {
            // Fallback: Cache tagging not supported by local cache driver
        }

        return response()->json([
            'success' => true,
            'data' => [
                'role_id' => $role->id,
                'synced_pages' => $role->pages()->pluck('page_identifier'),
            ],
        ]);
    }
}
