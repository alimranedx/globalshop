<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\ShopManager\Services\SalesSummaryService;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;

class DashboardStatsController extends Controller
{
    /**
     * Return pre-aggregated sales analytics for the active tenant.
     * Single optimised query — no JOINs, no raw sales table scans.
     */
    public function __invoke(SalesSummaryService $service): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $stats = $service->getDashboardStats($shop->id);

        return response()->json([
            'success' => true,
            'data'    => $stats,
        ]);
    }
}
