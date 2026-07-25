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
            if (!Schema::hasColumn('marketplace_customers', 'password')) {
                $table->string('password')->nullable()->after('phone');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('marketplace_customers', function (Blueprint $table) {
            if (Schema::hasColumn('marketplace_customers', 'password')) {
                $table->dropColumn('password');
            }
        });
    }
};
