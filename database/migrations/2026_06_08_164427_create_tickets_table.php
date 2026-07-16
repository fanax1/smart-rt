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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_tiket')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nama_lengkap');
            $table->string('whatsapp');
            $table->string('no_rumah')->nullable();
            $table->string('email')->nullable();
            $table->string('keperluan')->nullable();
            $table->string('kategori');
            $table->string('judul');
            $table->text('pesan')->nullable();
            $table->string('lampiran_path')->nullable();
            $table->string('lampiran_original_name')->nullable();
            $table->string('status')->default('Menunggu Admin');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
