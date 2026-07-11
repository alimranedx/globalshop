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
            'currency' => 'nullable|string|in:USD,BDT',
            'language' => 'nullable|string|in:en,bn',
            'refund_window_days' => 'nullable|integer|min:0|max:365',
        ]);

        $status = $validated['status'];
        // Normalize status to 'inactive' if 'deactive' is submitted
        if ($status === 'deactive') {
            $status = 'inactive';
        }

        $oldName = $shop->name;
        $oldStatus = $shop->status;
        $oldCurrency = $shop->currency;
        $oldLanguage = $shop->language;
        $oldRefundDays = $shop->refund_window_days ?? 30;

        $currency = $validated['currency'] ?? 'USD';
        $language = $validated['language'] ?? 'en';
        $refundWindowDays = isset($validated['refund_window_days']) ? (int)$validated['refund_window_days'] : 30;

        $shop->update([
            'name' => $validated['name'],
            'status' => $status,
            'currency' => $currency,
            'language' => $language,
            'refund_window_days' => $refundWindowDays,
        ]);

        // Log Activity
        $logger = resolve(\App\Modules\AuditLog\Actions\LogActivityAction::class);
        $logger->execute(
            'shop.settings_updated',
            "Shop settings updated. Name: {$oldName} -> {$validated['name']}, Status: {$oldStatus} -> {$status}, Currency: {$oldCurrency} -> {$currency}, Language: {$oldLanguage} -> {$language}, Refund Window: {$oldRefundDays} -> {$refundWindowDays} days.",
            null,
            ['name' => $validated['name'], 'status' => $status, 'currency' => $currency, 'language' => $language, 'refund_window_days' => $refundWindowDays],
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
                'currency' => $shop->currency,
                'language' => $shop->language,
                'refund_window_days' => $shop->refund_window_days,
            ],
        ]);
    }
}
