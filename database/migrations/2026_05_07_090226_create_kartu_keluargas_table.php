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
    Schema::create('kartu_keluargas', function (Blueprint $table) {
        $table->id();

        $table->foreignId('hunian_id')
            ->constrained('hunians')
            ->cascadeOnDelete();

        $table->string('no_kk')->unique();
        $table->string('nama_kepala_keluarga');

        $table->text('alamat')->nullable();
        $table->string('rt')->nullable();
        $table->string('rw')->nullable();
        $table->string('kelurahan_desa')->nullable();
        $table->string('kecamatan')->nullable();
        $table->string('kabupaten_kota')->nullable();
        $table->string('provinsi')->nullable();
        $table->string('kode_pos')->nullable();

        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('kartu_keluargas');
}
};
