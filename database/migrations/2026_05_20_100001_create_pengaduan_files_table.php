<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaduan_files', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pengaduan_id')
                ->constrained('pengaduans')
                ->cascadeOnDelete();

            $table->string('label', 120)->nullable();
            $table->string('original_name');
            $table->string('path');
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->boolean('is_admin_file')->default(false);
            $table->timestamps();

            $table->index('pengaduan_id');
            $table->index('is_admin_file');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaduan_files');
    }
};
