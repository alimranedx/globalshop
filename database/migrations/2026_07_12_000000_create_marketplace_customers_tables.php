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
        // 1. Global Marketplace Customers (self-registered via phone OTP)
        Schema::create('marketplace_customers', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20)->unique();  // Identity key — phone is globally unique
            $table->string('name', 255)->nullable(); // Filled after OTP verification
            $table->string('otp', 10)->nullable();   // Current pending OTP
            $table->timestamp('otp_expires_at')->nullable();
            $table->timestamp('verified_at')->nullable(); // null = unverified, set = active account
            $table->timestamps();

            $table->index('phone');
            $table->index('verified_at');
        });

        // 2. Customer Preferred Shops pivot (max 5 per customer, enforced at API level)
        Schema::create('customer_preferred_shops', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id')->index();
            $table->unsignedBigInteger('shop_id')->index();
            $table->timestamp('created_at')->nullable();

            $table->foreign('customer_id')
                  ->references('id')
                  ->on('marketplace_customers')
                  ->onDelete('cascade');

            $table->foreign('shop_id')
                  ->references('id')
                  ->on('shops')
                  ->onDelete('cascade');

            $table->unique(['customer_id', 'shop_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_preferred_shops');
        Schema::dropIfExists('marketplace_customers');
    }
};
