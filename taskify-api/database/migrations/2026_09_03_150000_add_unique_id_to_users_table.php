<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add unique_id column directly to users table
        if (!Schema::hasColumn('users', 'unique_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('unique_id', 50)->nullable()->unique()->after('id');
            });
        }

        // Generate unique IDs for all existing users
        $users = DB::table('users')->orderBy('id')->get();
        foreach ($users as $index => $user) {
            $uniqueCode = 'MEM-' . str_pad((string)($user->id), 4, '0', STR_PAD_LEFT);
            DB::table('users')->where('id', $user->id)->update([
                'unique_id' => $uniqueCode,
            ]);
        }

        // Drop the redundant team_members table
        Schema::dropIfExists('team_members');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'unique_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('unique_id');
            });
        }
    }
};
