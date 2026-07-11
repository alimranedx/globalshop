<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add cost_price to products
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost_price', 15, 2)->unsigned()->default(0)->after('price');
        });

        // Backfill: set cost_price to ~60% of selling price for existing products
        DB::table('products')->whereRaw('cost_price = 0 AND price > 0')->update([
            'cost_price' => DB::raw('ROUND(price * 0.6, 2)'),
        ]);

        // 2. Add cost_price to sale_items (snapshot at time of sale)
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('cost_price', 15, 2)->unsigned()->default(0)->after('price');
        });

        // 3. Create shop_daily_summaries (denormalized analytics table)
        Schema::create('shop_daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id');
            $table->date('summary_date');
            $table->unsignedInteger('total_orders')->default(0);
            $table->decimal('total_revenue', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->decimal('total_profit', 15, 2)->default(0);
            $table->decimal('total_discount', 15, 2)->default(0);
            $table->decimal('total_tax', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->unique(['shop_id', 'summary_date']);
            $table->index(['shop_id', 'summary_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_daily_summaries');

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('cost_price');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('cost_price');
        });
    }
};
