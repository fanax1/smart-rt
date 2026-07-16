<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kegiatan_partisipasis')) {
            return;
        }

        Schema::create('kegiatan_partisipasis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')->constrained('kegiatans')->cascadeOnDelete();
            $table->foreignId('warga_id')->constrained('wargas')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['ikut', 'batal'])->default('ikut')->index();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['kegiatan_id', 'warga_id'], 'kegiatan_partisipasi_unique');
            $table->index(['kegiatan_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kegiatan_partisipasis');
    }
};
