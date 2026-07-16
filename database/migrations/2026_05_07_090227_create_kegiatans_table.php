<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kegiatans', function (Blueprint $table) {
            $table->id();

            $table->string('judul', 200);
            $table->date('tanggal');
            $table->time('jam_mulai')->nullable();
            $table->time('jam_selesai')->nullable();

            $table->string('lokasi', 200)->nullable();
            $table->string('kategori', 100);
            $table->boolean('memerlukan_dana')->default(false);
            $table->decimal('estimasi_biaya', 15, 2)->default(0);

            $table->string('status_kegiatan', 50)->default('Draft');

            $table->text('deskripsi')->nullable();
            $table->string('penanggung_jawab', 150)->nullable();
            $table->unsignedInteger('target_peserta')->nullable();
            $table->boolean('wajib_hadir')->default(false);

            $table->string('sumber_dana', 100)->nullable();
            $table->string('penanggung_jawab_dana', 150)->nullable();
            $table->text('catatan_anggaran')->nullable();

            $table->string('poster')->nullable();
            $table->text('catatan')->nullable();

            $table->timestamps();

            $table->index('tanggal');
            $table->index('kategori');
            $table->index('status_kegiatan');
            $table->index('memerlukan_dana');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kegiatans');
    }
};
