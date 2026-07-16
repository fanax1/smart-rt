<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah kolom baru terlebih dahulu
        Schema::table('dokumen_files', function (Blueprint $table) {
            $table->string('category', 20)->default('main')->after('dokumen_id')->index();
            $table->string('stored_name')->nullable()->after('original_name');
            $table->string('stored_path')->nullable()->after('stored_name');
            $table->string('extension', 20)->nullable()->after('stored_path');
            $table->boolean('is_downloadable')->default(true)->after('size');
            $table->unsignedInteger('sort_order')->default(0)->after('is_downloadable');
        });

        // 2. Ambil data dokumen_files untuk dimigrasi isinya menggunakan PHP murni
        $files = DB::table('dokumen_files')->get();

        foreach ($files as $file) {
            $updateData = [];

            // Migrasi data dari file_type lama → category baru
            if (isset($file->file_type)) {
                $updateData['category'] = match ($file->file_type) {
                    'main_file' => 'main',
                    'cover_image' => 'cover',
                    'attachment' => 'attachment',
                    'gallery_image' => 'gallery',
                    default => 'main',
                };
            }

            // Migrasi path lama ke stored_path
            $currentStoredPath = $file->stored_path;
            if (empty($currentStoredPath) && !empty($file->path)) {
                $currentStoredPath = $file->path;
                $updateData['stored_path'] = $currentStoredPath;
            }

            // Isi stored_name dari stored_path (Pengganti SUBSTRING_INDEX ke-1)
            if (empty($file->stored_name) && !empty($currentStoredPath)) {
                $pathParts = explode('/', $currentStoredPath);
                $updateData['stored_name'] = end($pathParts);
            }

            // Isi extension dari original_name (Pengganti SUBSTRING_INDEX ke-2)
            if (empty($file->extension) && !empty($file->original_name) && str_contains($file->original_name, '.')) {
                $nameParts = explode('.', $file->original_name);
                $updateData['extension'] = strtolower(end($nameParts));
            }

            // Lakukan update per baris data jika ada yang berubah
            if (!empty($updateData)) {
                DB::table('dokumen_files')
                    ->where('id', $file->id)
                    ->update($updateData);
            }
        }
    }

    public function down(): void
    {
        Schema::table('dokumen_files', function (Blueprint $table) {
            $table->dropColumn([
                'category',
                'stored_name',
                'stored_path',
                'extension',
                'is_downloadable',
                'sort_order',
            ]);
        });
    }
};
