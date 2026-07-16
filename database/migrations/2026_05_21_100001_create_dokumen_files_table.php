<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokumen_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dokumen_id')->constrained('dokumens')->cascadeOnDelete();
            $table->string('original_name');
            $table->string('path');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->string('file_type', 40)->default('main_file')->index();
            $table->timestamps();

            $table->index('dokumen_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumen_files');
    }
};
