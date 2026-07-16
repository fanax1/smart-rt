<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengumuman_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengumuman_id')->constrained('pengumumans')->cascadeOnDelete();
            $table->string('original_name');
            $table->string('path');
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();

            $table->index('pengumuman_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengumuman_files');
    }
};
