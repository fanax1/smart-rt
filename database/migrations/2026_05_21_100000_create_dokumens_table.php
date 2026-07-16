<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokumens', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->string('slug')->unique();
            $table->text('deskripsi')->nullable();
            $table->string('kategori', 80)->index();
            $table->string('tipe', 50)->default('manual_upload')->index();
            $table->string('visibility', 30)->default('admin')->index();
            $table->string('status', 30)->default('draft')->index();
            $table->unsignedTinyInteger('periode_bulan')->nullable();
            $table->unsignedSmallInteger('periode_tahun')->nullable();
            $table->timestamp('published_at')->nullable()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'visibility']);
            $table->index(['kategori', 'tipe']);
            $table->index(['periode_tahun', 'periode_bulan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumens');
    }
};
