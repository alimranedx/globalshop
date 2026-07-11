<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fetch all products to map cost_price
        $products = DB::table('products')->get()->keyBy('id');

        // 2. Backfill cost_price in existing sale_items
        $saleItems = DB::table('sale_items')->get();
        foreach ($saleItems as $item) {
            $costPrice = 0.00;
            if (isset($products[$item->product_id])) {
                $costPrice = $products[$item->product_id]->cost_price;
            } else {
                // Fallback to 60% of price
                $costPrice = round($item->price * 0.6, 2);
            }

            DB::table('sale_items')
                ->where('id', $item->id)
                ->update(['cost_price' => $costPrice]);
        }

        // 3. Backfill shop_daily_summaries
        // Group sales by shop_id and date
        $sales = DB::table('sales')->get();
        
        foreach ($sales as $sale) {
            $date = Carbon::parse($sale->created_at);
            $dateStr = $date->toDateString();

            // Calculate cost for this specific sale
            $items = DB::table('sale_items')->where('sale_id', $sale->id)->get();
            $saleCost = 0.00;
            foreach ($items as $item) {
                // Fetch the updated cost_price we just backfilled
                $costPrice = DB::table('sale_items')->where('id', $item->id)->value('cost_price') ?: 0.00;
                $saleCost += round($costPrice * $item->quantity, 2);
            }

            // Find or create daily summary
            $summary = DB::table('shop_daily_summaries')
                ->where('shop_id', $sale->shop_id)
                ->where('summary_date', $dateStr)
                ->first();

            if ($summary) {
                DB::table('shop_daily_summaries')
                    ->where('id', $summary->id)
                    ->update([
                        'total_orders'   => $summary->total_orders + 1,
                        'total_revenue'  => $summary->total_revenue + $sale->total,
                        'total_cost'     => $summary->total_cost + $saleCost,
                        'total_profit'   => $summary->total_profit + ($sale->total - $saleCost),
                        'total_discount' => $summary->total_discount + $sale->discount,
                        'total_tax'      => $summary->total_tax + $sale->tax,
                        'updated_at'     => Carbon::now(),
                    ]);
            } else {
                DB::table('shop_daily_summaries')->insert([
                    'shop_id'        => $sale->shop_id,
                    'summary_date'   => $dateStr,
                    'total_orders'   => 1,
                    'total_revenue'  => $sale->total,
                    'total_cost'     => $saleCost,
                    'total_profit'   => $sale->total - $saleCost,
                    'total_discount' => $sale->discount,
                    'total_tax'      => $sale->tax,
                    'created_at'     => Carbon::now(),
                    'updated_at'     => Carbon::now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Truncate the daily summaries
        DB::table('shop_daily_summaries')->truncate();

        // Reset sale_items cost_prices to 0
        DB::table('sale_items')->update(['cost_price' => 0]);
    }
};
