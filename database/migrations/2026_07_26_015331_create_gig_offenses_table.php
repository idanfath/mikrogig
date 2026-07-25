<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gig_offenses', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('gig_id')->constrained()->restrictOnDelete();
            $table->foreignId('gig_exit_request_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->foreignId('gig_dispute_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->unsignedInteger('sequence');
            $table->unsignedInteger('duration_days');
            $table->foreignId('user_ban_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'sequence']);
            $table->index(['gig_id', 'id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_offenses');
    }
};
