<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaduans', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_pengaduan', 40)->unique();

            $table->foreignId('warga_id')
                ->nullable()
                ->constrained('wargas')
                ->nullOnDelete();

            $table->foreignId('kartu_keluarga_id')
                ->nullable()
                ->constrained('kartu_keluargas')
                ->nullOnDelete();

            $table->foreignId('hunian_id')
                ->nullable()
                ->constrained('hunians')
                ->nullOnDelete();

            $table->string('judul', 180);
            $table->string('kategori', 60)->default('lainnya');
            $table->string('prioritas', 30)->default('sedang');
            $table->string('lokasi', 180)->nullable();
            $table->text('deskripsi');
            $table->string('status', 30)->default('diajukan');
            $table->text('catatan_admin')->nullable();

            $table->timestamp('tanggal_pengaduan')->useCurrent();
            $table->timestamp('tanggal_diproses')->nullable();
            $table->timestamp('tanggal_selesai')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index('status');
            $table->index('kategori');
            $table->index('prioritas');
            $table->index('tanggal_pengaduan');
            $table->index(['warga_id', 'status']);
            $table->index(['kartu_keluarga_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaduans');
    }
};
