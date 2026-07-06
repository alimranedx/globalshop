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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id')->index();
            $table->string('invoice_number')->unique();
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount', 15, 2)->default(0.00);
            $table->decimal('tax', 15, 2)->default(0.00);
            $table->decimal('total', 15, 2);
            $table->string('payment_method', 50)->default('cash');
            $table->unsignedBigInteger('created_by')->index();
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id')->index();
            $table->unsignedBigInteger('product_id')->index();
            $table->string('product_name');
            $table->decimal('quantity', 12, 2);
            $table->decimal('price', 15, 2);
            $table->decimal('total', 15, 2);
            $table->timestamps();

            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
