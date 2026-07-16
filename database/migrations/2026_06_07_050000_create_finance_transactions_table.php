<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_transactions', function (Blueprint $table) {
            $table->id();
            $table->enum('tipe', ['pemasukan', 'pengeluaran']);
            $table->string('kategori'); // Iuran, Donasi, Sponsorship, Operasional, Kegiatan, Lain-lain
            $table->decimal('jumlah', 15, 2);
            $table->text('deskripsi');
            $table->date('tanggal');
            $table->string('status')->default('Berhasil');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_transactions');
    }
};
