<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengumumans', function (Blueprint $table) {
            $table->id();
            $table->string('judul', 180);
            $table->longText('isi');
            $table->string('kategori', 80)->default('umum');
            $table->string('target_audiens', 30)->default('semua');
            $table->string('status', 30)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'target_audiens']);
            $table->index('kategori');
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengumumans');
    }
};
