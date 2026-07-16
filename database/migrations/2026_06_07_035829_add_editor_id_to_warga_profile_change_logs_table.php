<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warga_profile_change_logs', function (Blueprint $table) {
            $table->foreignId('editor_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('warga_profile_change_logs', function (Blueprint $table) {
            $table->dropForeign(['editor_id']);
            $table->dropColumn('editor_id');
        });
    }
};
