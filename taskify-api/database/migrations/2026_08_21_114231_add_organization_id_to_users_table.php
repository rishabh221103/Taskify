<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->foreignId('organization_id')->nullable()->constrained()->cascadeOnDelete();
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropForeign(['organization_id']);
        $table->dropColumn('organization_id');
    });
}
};
