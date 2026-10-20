<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Shop;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Backfill any shop where subdomain is null or empty
        DB::statement("UPDATE shops SET subdomain = slug WHERE subdomain IS NULL OR subdomain = ''");

        // 2. Ensure domain is populated with canonical subdomain.central_domain
        $centralDomain = config('app.central_domain', 'shopbusket.com');
        if (DB::getDriverName() === 'sqlite') {
            DB::statement("UPDATE shops SET domain = subdomain || '.' || '{$centralDomain}' WHERE domain IS NULL OR domain = ''");
        } else {
            DB::statement("UPDATE shops SET domain = CONCAT(subdomain, '.', '{$centralDomain}') WHERE domain IS NULL OR domain = ''");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive data migration
    }
};
