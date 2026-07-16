<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('committee_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('committee_period_id')
                ->constrained('committee_periods')
                ->cascadeOnDelete();

            $table->string('name');
            $table->string('position');
            $table->enum('category', ['core', 'division', 'member'])->default('member')->index();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('photo_path')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->index(['committee_period_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('committee_members');
    }
};