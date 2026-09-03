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
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone_number')->nullable();
            $table->string('title')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('joined_date')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status']);
        });

        // Populate existing ("old") members who have the 'member' role into the team_members table
        $existingMembers = DB::table('users')
            ->join('model_has_roles', function ($join) {
                $join->on('users.id', '=', 'model_has_roles.model_id')
                     ->where('model_has_roles.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('roles.name', 'member')
            ->select('users.id as user_id', 'users.organization_id', 'users.name', 'users.email', 'users.phone_number', 'users.title', 'users.created_at')
            ->get();

        $now = now();
        foreach ($existingMembers as $member) {
            DB::table('team_members')->updateOrInsert(
                ['user_id' => $member->user_id],
                [
                    'organization_id' => $member->organization_id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'phone_number' => $member->phone_number,
                    'title' => $member->title,
                    'status' => 'active',
                    'joined_date' => $member->created_at ?? $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_members');
    }
};
