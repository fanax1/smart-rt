<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_surats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kartu_keluarga_id')->constrained('kartu_keluargas')->cascadeOnDelete();
            $table->foreignId('pemohon_warga_id')->nullable()->constrained('wargas')->nullOnDelete();
            $table->foreignId('jenis_surat_id')->constrained('jenis_surats')->restrictOnDelete();
            $table->string('nomor_pengajuan', 80)->unique();
            $table->string('nomor_surat', 120)->nullable();
            $table->string('ringkasan_keperluan', 180)->nullable();
            $table->json('data_pengajuan')->nullable();
            $table->text('catatan_warga')->nullable();
            $table->text('catatan_admin')->nullable();
            $table->string('status', 40)->default('diajukan');
            $table->timestamp('tanggal_pengajuan')->nullable();
            $table->timestamp('tanggal_diverifikasi')->nullable();
            $table->timestamp('tanggal_disetujui')->nullable();
            $table->timestamp('tanggal_selesai')->nullable();
            $table->timestamp('tanggal_diambil')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['kartu_keluarga_id', 'status']);
            $table->index(['jenis_surat_id', 'status']);
            $table->index('tanggal_pengajuan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_surats');
    }
};
