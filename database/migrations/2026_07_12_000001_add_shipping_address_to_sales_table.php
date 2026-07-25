<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->text('shipping_address')->nullable()->after('customer_phone');
        });

        Schema::table('marketplace_customers', function (Blueprint $table) {
            $table->text('shipping_address')->nullable()->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('shipping_address');
        });

        Schema::table('marketplace_customers', function (Blueprint $table) {
            $table->dropColumn('shipping_address');
        });
    }
};
