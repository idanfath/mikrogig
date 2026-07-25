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
        Schema::create('gig_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gig_id')->constrained()->restrictOnDelete();
            $table->foreignId('rater_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->restrictOnDelete();
            $table->unsignedTinyInteger('score');
            $table->string('comment', 1000)->nullable();
            $table->timestamps();

            $table->unique(['gig_id', 'rater_id']);
            $table->index(['recipient_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_ratings');
    }
};
