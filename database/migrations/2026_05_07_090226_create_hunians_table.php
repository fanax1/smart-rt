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
    Schema::create('hunians', function (Blueprint $table) {
        $table->id();
        $table->string('no_rumah')->unique();

        $table->enum('status_hunian', [
            'Milik Sendiri',
            'Kontrak/Sewa',
            'Kos',
            'Ikut Keluarga',
            'Rumah Dinas',
            'Lainnya'
        ]);

        $table->enum('status_warga', [
            'Warga Tetap',
            'Warga Kontrak',
            'Warga Kos',
            'Warga Domisili',
            'Pendatang',
            'Nonaktif'
        ]);

        $table->string('kontak_penghuni')->nullable();
        $table->text('alamat_hunian')->nullable();

        $table->string('pemilik_nama')->nullable();
        $table->string('pemilik_kontak')->nullable();
        $table->text('pemilik_alamat')->nullable();

        $table->date('tanggal_mulai_menempati')->nullable();
        $table->date('masa_kontrak_selesai')->nullable();

        $table->string('nama_kos')->nullable();
        $table->string('nomor_kamar')->nullable();
        $table->text('catatan_hunian')->nullable();

        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('hunians');
}
};
