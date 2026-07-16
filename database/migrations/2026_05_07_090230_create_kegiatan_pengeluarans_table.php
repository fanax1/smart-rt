<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kegiatan_pengeluarans', function (Blueprint $table) {
            $table->id();

            $table->foreignId('kegiatan_id')
                ->constrained('kegiatans')
                ->cascadeOnDelete();

            $table->date('tanggal_pengeluaran');
            $table->string('nama_pengeluaran', 150);
            $table->string('kategori_pengeluaran', 100);
            $table->decimal('nominal', 15, 2)->default(0);
            $table->string('metode_pembayaran', 50)->nullable();
            $table->string('bukti_pembayaran')->nullable();
            $table->text('keterangan')->nullable();

            $table->timestamps();

            $table->index('kegiatan_id');
            $table->index('tanggal_pengeluaran');
            $table->index('kategori_pengeluaran');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kegiatan_pengeluarans');
    }
};
