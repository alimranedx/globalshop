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
        // 1. Shops Table (Tenants)
        Schema::create('shops', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('owner_id', 26)->index(); // Foreign Key to users.id
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->nullable()->unique();
            $table->string('status', 50)->default('pending')->index();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('owner_id')->references('id')->on('users')->onDelete('restrict');
        });

        // 2. Plans Table
        Schema::create('plans', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->string('name', 100);
            $table->decimal('price', 10, 2);
            $table->string('billing_period', 50)->default('monthly');
            $table->json('limits'); // JSON: max_products, max_images_per_product, max_employees
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Subscriptions Table
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('shop_id', 26)->index();
            $table->char('plan_id', 26)->index();
            $table->string('status', 50)->default('active')->index();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('plan_id')->references('id')->on('plans')->onDelete('restrict');
        });

        // 4. Roles Table
        Schema::create('roles', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('shop_id', 26)->index();
            $table->string('name', 100);
            $table->boolean('is_custom')->default(true);
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->unique(['shop_id', 'name']);
        });

        // 5. Role Pages Table (Permissions)
        Schema::create('role_pages', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('role_id', 26)->index();
            $table->string('page_identifier');
            $table->timestamp('created_at')->nullable();

            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->unique(['role_id', 'page_identifier']);
        });

        // 6. Shop User Joint Table (Employees)
        Schema::create('shop_user', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('shop_id', 26)->index();
            $table->char('user_id', 26)->index();
            $table->char('role_id', 26)->index();
            $table->string('status', 50)->default('active')->index();
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('restrict');
            $table->unique(['shop_id', 'user_id']);
        });

        // 7. Categories Table (Hybrid Global/Tenant Taxonomy)
        Schema::create('categories', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('shop_id', 26)->nullable()->index(); // Null = global category
            $table->char('parent_id', 26)->nullable()->index();
            $table->char('global_category_id', 26)->nullable()->index(); // Mapping shop cat to global cat
            $table->string('name');
            $table->string('slug');
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('categories')->onDelete('restrict');
            $table->foreign('global_category_id')->references('id')->on('categories')->onDelete('set null');
            $table->unique(['shop_id', 'parent_id', 'slug']);
        });

        // 8. Brands Table
        Schema::create('brands', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('shop_id', 26)->index();
            $table->string('name');
            $table->string('slug');
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->unique(['shop_id', 'slug']);
        });

        // 9. Products Table
        Schema::create('products', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('shop_id', 26)->index();
            $table->char('category_id', 26)->index();
            $table->char('brand_id', 26)->nullable()->index();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->decimal('price', 15, 2)->unsigned();
            $table->integer('stock_quantity')->unsigned()->default(0);
            $table->string('status', 50)->default('draft')->index();
            $table->char('created_by', 26)->index();
            $table->char('updated_by', 26)->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('restrict');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            $table->unique(['shop_id', 'slug']);
            // Index for shop browsing
            $table->index(['shop_id', 'status', 'created_at']);
        });

        // 10. Product Images Table
        Schema::create('product_images', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('shop_id', 26)->index();
            $table->char('product_id', 26)->index();
            $table->string('path');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // 11. Activity Logs Table
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->char('id', 26)->primary(); // ULID
            $table->char('shop_id', 26)->nullable()->index(); // Null = Platform level
            $table->char('user_id', 26)->nullable()->index();
            $table->string('action', 100)->index();
            $table->string('description', 500);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('device_type', 100)->nullable();
            $table->timestamp('created_at')->nullable()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('shop_user');
        Schema::dropIfExists('role_pages');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('shops');
    }
};
