<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_surat_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_surat_id')->constrained('pengajuan_surats')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('kategori', 80)->default('dokumen_pendukung');
            $table->string('label', 150)->nullable();
            $table->string('original_name');
            $table->string('path');
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->boolean('is_admin_file')->default(false);
            $table->timestamps();

            $table->index(['pengajuan_surat_id', 'kategori']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_surat_files');
    }
};
