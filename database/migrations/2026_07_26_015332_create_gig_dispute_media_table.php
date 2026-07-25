<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gig_dispute_media', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('gig_dispute_submission_id')->constrained()->restrictOnDelete();
            $table->string('path', 255);
            $table->timestamps();
            $table->index(['gig_dispute_submission_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gig_dispute_media');
    }
};
