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
        Schema::table('marketplace_customers', function (Blueprint $table) {
            if (!Schema::hasColumn('marketplace_customers', 'avatar')) {
                $table->string('avatar', 500)->nullable()->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('marketplace_customers', function (Blueprint $table) {
            if (Schema::hasColumn('marketplace_customers', 'avatar')) {
                $table->dropColumn('avatar');
            }
        });
    }
};
