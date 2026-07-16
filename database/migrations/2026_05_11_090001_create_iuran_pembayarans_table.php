<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('iuran_pembayarans', function (Blueprint $table) {
            $table->id();

            $table->foreignId('kartu_keluarga_id')
                ->constrained('kartu_keluargas')
                ->cascadeOnDelete();

            $table->date('periode');
            $table->decimal('jumlah_dibayar', 15, 2)->default(0);
            $table->date('tanggal_bayar');
            $table->string('metode_pembayaran', 50);
            $table->string('status_verifikasi', 30)->default('verified');
            $table->string('bukti_pembayaran')->nullable();
            $table->text('catatan')->nullable();
            $table->text('catatan_verifikasi')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();

            $table->index(['kartu_keluarga_id', 'periode']);
            $table->index('periode');
            $table->index('status_verifikasi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('iuran_pembayarans');
    }
};
