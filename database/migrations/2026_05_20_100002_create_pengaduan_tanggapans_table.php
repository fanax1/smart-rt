<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaduan_tanggapans', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pengaduan_id')
                ->constrained('pengaduans')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('status_from', 30)->nullable();
            $table->string('status_to', 30)->nullable();
            $table->text('pesan')->nullable();
            $table->boolean('is_admin')->default(false);
            $table->timestamps();

            $table->index('pengaduan_id');
            $table->index('user_id');
            $table->index('status_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaduan_tanggapans');
    }
};
