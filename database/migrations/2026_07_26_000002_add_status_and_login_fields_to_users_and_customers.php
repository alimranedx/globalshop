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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'status')) {
                $table->enum('status', ['active', 'suspended', 'deactivated'])->default('active')->after('password');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 50)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('status');
            }
        });

        Schema::table('marketplace_customers', function (Blueprint $table) {
            if (!Schema::hasColumn('marketplace_customers', 'email')) {
                $table->string('email')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('marketplace_customers', 'status')) {
                $table->enum('status', ['active', 'suspended', 'deactivated'])->default('active')->after('password');
            }
            if (!Schema::hasColumn('marketplace_customers', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'phone', 'last_login_at']);
        });

        Schema::table('marketplace_customers', function (Blueprint $table) {
            $table->dropColumn(['email', 'status', 'last_login_at']);
        });
    }
};
