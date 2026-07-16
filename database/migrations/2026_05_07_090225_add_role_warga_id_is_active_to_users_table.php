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
        $table->enum('role', ['admin', 'warga'])->default('warga')->after('password');
        $table->unsignedBigInteger('warga_id')->nullable()->after('role');
        $table->boolean('is_active')->default(true)->after('warga_id');
    });
}

    public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['role', 'warga_id', 'is_active']);
    });
}
};
