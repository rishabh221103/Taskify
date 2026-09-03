<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->string('member_id', 50)->nullable()->unique()->after('organization_id');
        });

        // Generate unique member IDs for all existing records in team_members
        $members = DB::table('team_members')->orderBy('id')->get();
        foreach ($members as $index => $member) {
            $uniqueCode = 'MEM-' . str_pad((string)($member->id), 4, '0', STR_PAD_LEFT);
            DB::table('team_members')->where('id', $member->id)->update([
                'member_id' => $uniqueCode,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropColumn('member_id');
        });
    }
};
