<?php

namespace App\Modules\ShopManager\Services;

use App\Models\ShopDailySummary;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SalesSummaryService
{
    /**
     * Atomically increment the daily summary row after a sale.
     * Uses firstOrCreate + raw increment to avoid race conditions.
     */
    public function recordSale(
        int    $shopId,
        Carbon $date,
        float  $revenue,
        float  $cost,
        float  $discount,
        float  $tax
    ): void {
        $dateStr = $date->toDateString();

        // Ensure the row exists (idempotent)
        $summary = ShopDailySummary::firstOrCreate(
            ['shop_id' => $shopId, 'summary_date' => $dateStr],
            [
                'total_orders'   => 0,
                'total_revenue'  => 0,
                'total_cost'     => 0,
                'total_profit'   => 0,
                'total_discount' => 0,
                'total_tax'      => 0,
            ]
        );

        $profit = round($revenue - $cost, 2);

        // Perform atomic increments directly on the model instance (uses primary key 'id')
        $summary->increment('total_orders', 1);
        $summary->increment('total_revenue', $revenue);
        $summary->increment('total_cost', $cost);
        $summary->increment('total_profit', $profit);
        $summary->increment('total_discount', $discount);
        $summary->increment('total_tax', $tax);
    }

    /**
     * Get dashboard statistics using a SINGLE optimised query.
     * Returns today, this-month, and this-year aggregations.
     *
     * Only SELECTs the SUM columns needed — no JOINs, no subqueries.
     */
    public function getDashboardStats(int $shopId): array
    {
        $today      = Carbon::today()->toDateString();
        $monthStart = Carbon::today()->startOfMonth()->toDateString();
        $yearStart  = Carbon::today()->startOfYear()->toDateString();

        // One query — three conditional aggregations
        $row = DB::table('shop_daily_summaries')
            ->where('shop_id', $shopId)
            ->whereDate('summary_date', '>=', $yearStart)
            ->selectRaw("
                SUM(CASE WHEN DATE(summary_date) = ? THEN total_orders   ELSE 0 END) AS today_orders,
                SUM(CASE WHEN DATE(summary_date) = ? THEN total_revenue  ELSE 0 END) AS today_revenue,
                SUM(CASE WHEN DATE(summary_date) = ? THEN total_profit   ELSE 0 END) AS today_profit,
                SUM(CASE WHEN DATE(summary_date) = ? THEN total_discount ELSE 0 END) AS today_discount,
                SUM(CASE WHEN DATE(summary_date) = ? THEN total_tax      ELSE 0 END) AS today_tax,

                SUM(CASE WHEN DATE(summary_date) >= ? THEN total_orders   ELSE 0 END) AS month_orders,
                SUM(CASE WHEN DATE(summary_date) >= ? THEN total_revenue  ELSE 0 END) AS month_revenue,
                SUM(CASE WHEN DATE(summary_date) >= ? THEN total_profit   ELSE 0 END) AS month_profit,
                SUM(CASE WHEN DATE(summary_date) >= ? THEN total_discount ELSE 0 END) AS month_discount,
                SUM(CASE WHEN DATE(summary_date) >= ? THEN total_tax      ELSE 0 END) AS month_tax,

                SUM(total_orders)   AS year_orders,
                SUM(total_revenue)  AS year_revenue,
                SUM(total_profit)   AS year_profit,
                SUM(total_discount) AS year_discount,
                SUM(total_tax)      AS year_tax
            ", [
                $today, $today, $today, $today, $today,
                $monthStart, $monthStart, $monthStart, $monthStart, $monthStart,
            ])
            ->first();

        $format = fn ($prefix) => [
            'orders'   => (int)   ($row->{"{$prefix}_orders"}   ?? 0),
            'revenue'  => round((float) ($row->{"{$prefix}_revenue"}  ?? 0), 2),
            'profit'   => round((float) ($row->{"{$prefix}_profit"}   ?? 0), 2),
            'discount' => round((float) ($row->{"{$prefix}_discount"} ?? 0), 2),
            'tax'      => round((float) ($row->{"{$prefix}_tax"}      ?? 0), 2),
        ];

        return [
            'today' => $format('today'),
            'month' => $format('month'),
            'year'  => $format('year'),
        ];
    }
}
