<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dokumen_files', function (Blueprint $table) {
            // Tambah kolom baru setelah kolom lama
            $table->string('category', 20)->default('main')->after('dokumen_id')->index();
            $table->string('stored_name')->nullable()->after('original_name');
            $table->string('stored_path')->nullable()->after('stored_name');
            $table->string('extension', 20)->nullable()->after('stored_path');
            $table->boolean('is_downloadable')->default(true)->after('size');
            $table->unsignedInteger('sort_order')->default(0)->after('is_downloadable');
        });

        // Migrasi data dari file_type lama → category baru
        DB::statement("
            UPDATE dokumen_files SET category = CASE
                WHEN file_type = 'main_file'     THEN 'main'
                WHEN file_type = 'cover_image'   THEN 'cover'
                WHEN file_type = 'attachment'    THEN 'attachment'
                WHEN file_type = 'gallery_image' THEN 'gallery'
                ELSE 'main'
            END
        ");

        // Migrasi path lama ke stored_path
        DB::statement("
            UPDATE dokumen_files
            SET stored_path = path
            WHERE stored_path IS NULL AND path IS NOT NULL
        ");

        // Isi stored_name dari stored_path (basename)
        // Gunakan SUBSTRING_INDEX untuk MySQL/MariaDB
        DB::statement("
            UPDATE dokumen_files
            SET stored_name = SUBSTRING_INDEX(stored_path, '/', -1)
            WHERE stored_name IS NULL AND stored_path IS NOT NULL
        ");

        // Isi extension dari original_name
        DB::statement("
            UPDATE dokumen_files
            SET extension = LOWER(SUBSTRING_INDEX(original_name, '.', -1))
            WHERE extension IS NULL AND original_name IS NOT NULL AND original_name LIKE '%.%'
        ");
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
