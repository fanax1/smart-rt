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
    Schema::create('wargas', function (Blueprint $table) {
        $table->id();

        $table->foreignId('hunian_id')
            ->constrained('hunians')
            ->cascadeOnDelete();

        $table->foreignId('kartu_keluarga_id')
            ->constrained('kartu_keluargas')
            ->cascadeOnDelete();

        $table->string('nama_lengkap');
        $table->string('nik')->unique();

        $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan'])->nullable();

        $table->string('tempat_lahir')->nullable();
        $table->date('tanggal_lahir')->nullable();

        $table->string('agama')->nullable();
        $table->string('pendidikan')->nullable();
        $table->string('pekerjaan')->nullable();
        $table->string('status_perkawinan')->nullable();
        $table->string('hubungan_keluarga')->nullable();
        $table->string('kewarganegaraan')->default('WNI');

        $table->string('nama_ayah')->nullable();
        $table->string('nama_ibu')->nullable();

        $table->boolean('is_kepala_keluarga')->default(false);

        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('wargas');
}
};
