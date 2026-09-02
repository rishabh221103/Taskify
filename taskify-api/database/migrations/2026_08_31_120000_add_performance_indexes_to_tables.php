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
        Schema::table('tasks', function (Blueprint $table) {
            $table->index(['organization_id', 'status']);
            $table->index('project_id');
            $table->index('due_date');
        });

        Schema::table('task_user', function (Blueprint $table) {
            $table->index(['task_id', 'user_id']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->index(['organization_id', 'date']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'status']);
            $table->dropIndex(['project_id']);
            $table->dropIndex(['due_date']);
        });

        Schema::table('task_user', function (Blueprint $table) {
            $table->dropIndex(['task_id', 'user_id']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'date']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['organization_id']);
        });
    }
};
