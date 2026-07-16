<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_surat_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_surat_id')->constrained('pengajuan_surats')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 40);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['pengajuan_surat_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_surat_approvals');
    }
};
