<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('committee_periods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('start_year')->nullable();
            $table->unsignedSmallInteger('end_year')->nullable();
            $table->enum('status', ['draft', 'active', 'completed'])->default('draft')->index();
            $table->boolean('is_active')->default(false)->index();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['start_year', 'end_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('committee_periods');
    }
};