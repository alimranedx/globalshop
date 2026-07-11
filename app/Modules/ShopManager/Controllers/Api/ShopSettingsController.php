<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ShopSettingsController extends Controller
{
    /**
     * Update the active tenant's settings (name and status).
     */
    public function update(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        $user = Auth::user();

        if (! $shop || ($user->id !== $shop->owner_id && ! $user->is_platform_admin)) {
            return response()->json(['success' => false, 'message' => 'Only the Shop Owner can update settings.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'status' => 'required|string|in:active,inactive,deactive',
        ]);

        $status = $validated['status'];
        // Normalize status to 'inactive' if 'deactive' is submitted
        if ($status === 'deactive') {
            $status = 'inactive';
        }

        $oldName = $shop->name;
        $oldStatus = $shop->status;

        $shop->update([
            'name' => $validated['name'],
            'status' => $status,
        ]);

        // Log Activity
        $logger = resolve(\App\Modules\AuditLog\Actions\LogActivityAction::class);
        $logger->execute(
            'shop.settings_updated',
            "Shop settings updated. Name: {$oldName} -> {$validated['name']}, Status: {$oldStatus} -> {$status}.",
            null,
            ['name' => $validated['name'], 'status' => $status],
            $shop->id,
            $user->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Shop settings updated successfully.',
            'data' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'status' => $shop->status,
                'domain' => $shop->domain,
            ],
        ]);
    }
}
