<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('iuran_komponens', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100);
            $table->decimal('nominal', 15, 2)->default(0);
            $table->text('keterangan')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
            $table->index('urutan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('iuran_komponens');
    }
};
