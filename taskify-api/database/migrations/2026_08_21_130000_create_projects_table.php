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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['not_started', 'in_progress', 'on_hold', 'completed'])->default('not_started');
            $table->enum('priority', ['critical', 'high', 'medium', 'low'])->default('medium');
            $table->date('deadline')->nullable();
            $table->integer('progress')->default(0);
            $table->string('category')->default('Development');
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('low');
            $table->enum('business_impact', ['low', 'medium', 'high'])->default('low');
            $table->decimal('budget', 12, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
