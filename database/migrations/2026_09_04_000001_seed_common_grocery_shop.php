<?php

use Database\Seeders\CommonGrocerySeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        // 1. Generate SVG grocery assets if missing
        Artisan::call('grocery:generate-assets');

        // 2. Seed Common Grocery shop, employees, permissions, and catalog
        $seeder = new CommonGrocerySeeder();
        $seeder->run();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op for safe production rollback
    }
};
