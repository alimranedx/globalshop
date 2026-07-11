<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create Customers Table
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id')->index();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('membership_number')->nullable();
            $table->decimal('store_credit_balance', 15, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->unique(['shop_id', 'phone']);
            $table->unique(['shop_id', 'membership_number']);
        });

        // 2. Add refund_window_days to Shops Table
        Schema::table('shops', function (Blueprint $table) {
            $table->unsignedInteger('refund_window_days')->default(30)->after('language');
        });

        // 3. Add customer_id, status, and refunded_amount to Sales Table
        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedBigInteger('customer_id')->nullable()->after('invoice_number');
            $table->string('status', 50)->default('completed')->after('payment_method');
            $table->decimal('refunded_amount', 15, 2)->default(0.00)->after('status');

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->index(['shop_id', 'status']);
        });

        // 4. Add refunded_qty to Sale Items Table
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('refunded_qty', 12, 2)->default(0.00)->after('quantity');
        });

        // 5. Create Refunds Table
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id')->index();
            $table->unsignedBigInteger('sale_id')->index();
            $table->string('refund_number')->index();
            $table->string('type', 50); // 'full' or 'partial'
            $table->string('status', 50)->default('pending'); // 'pending', 'approved', 'rejected', 'completed'
            $table->string('reason', 255);
            $table->text('notes')->nullable();
            $table->decimal('refund_amount', 15, 2);
            $table->string('refund_method', 50)->default('original_method'); // 'original_method', 'cash', 'card', 'mobile', 'store_credit'
            $table->unsignedBigInteger('approved_by')->nullable()->index();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('created_by')->index();
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('restrict');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            $table->unique(['shop_id', 'refund_number']);
        });

        // 6. Create Refund Items Table
        Schema::create('refund_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('refund_id')->index();
            $table->unsignedBigInteger('sale_item_id')->index();
            $table->unsignedBigInteger('product_id')->index();
            $table->string('product_name');
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('cost_price', 15, 2)->default(0.00);
            $table->decimal('refund_amount', 15, 2);
            $table->boolean('restock')->default(true);
            $table->timestamps();

            $table->foreign('refund_id')->references('id')->on('refunds')->onDelete('cascade');
            $table->foreign('sale_item_id')->references('id')->on('sale_items')->onDelete('restrict');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });

        // 7. Add refund analytics fields to Shop Daily Summaries Table
        Schema::table('shop_daily_summaries', function (Blueprint $table) {
            $table->decimal('total_refunds', 15, 2)->default(0.00)->after('total_tax');
            $table->unsignedInteger('total_refund_count')->default(0)->after('total_refunds');
            $table->decimal('net_revenue', 15, 2)->default(0.00)->after('total_refund_count');
        });

        // Backfill net_revenue for existing records
        DB::table('shop_daily_summaries')->update([
            'net_revenue' => DB::raw('total_revenue')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shop_daily_summaries', function (Blueprint $table) {
            $table->dropColumn(['total_refunds', 'total_refund_count', 'net_revenue']);
        });

        Schema::dropIfExists('refund_items');
        Schema::dropIfExists('refunds');

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('refunded_qty');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['customer_id', 'status', 'refunded_amount']);
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn('refund_window_days');
        });

        Schema::dropIfExists('customers');
    }
};
