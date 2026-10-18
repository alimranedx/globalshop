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
        Schema::table('shops', function (Blueprint $table) {
            if (!Schema::hasColumn('shops', 'subdomain')) {
                $table->string('subdomain')->nullable()->unique()->after('slug');
            }
            if (!Schema::hasColumn('shops', 'custom_domain')) {
                $table->string('custom_domain')->nullable()->unique()->after('domain');
            }
            if (!Schema::hasColumn('shops', 'custom_domain_status')) {
                $table->string('custom_domain_status', 30)->default('pending')->after('custom_domain');
            }
            if (!Schema::hasColumn('shops', 'theme_slug')) {
                $table->string('theme_slug', 50)->default('default')->after('custom_domain_status');
            }
            if (!Schema::hasColumn('shops', 'theme_config')) {
                $table->json('theme_config')->nullable()->after('theme_slug');
            }
        });

        // Backfill existing shops: ensure subdomain mirrors slug if null
        DB::statement('UPDATE shops SET subdomain = slug WHERE subdomain IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $dropColumns = [];
            foreach (['subdomain', 'custom_domain', 'custom_domain_status', 'theme_slug', 'theme_config'] as $col) {
                if (Schema::hasColumn('shops', $col)) {
                    $dropColumns[] = $col;
                }
            }
            if (!empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
