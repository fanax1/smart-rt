<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kegiatan_anggaran_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('kegiatan_id')
                ->constrained('kegiatans')
                ->cascadeOnDelete();

            $table->string('nama_kebutuhan', 150);
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('harga_satuan', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->text('keterangan')->nullable();

            $table->timestamps();

            $table->index('kegiatan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kegiatan_anggaran_items');
    }
};
