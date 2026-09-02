<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS check_organization_user_limit");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op (we cannot un-drop without recreating the trigger code)
    }
};
