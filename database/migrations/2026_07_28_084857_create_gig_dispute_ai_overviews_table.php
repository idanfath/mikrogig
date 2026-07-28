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
        Schema::create('gig_dispute_ai_overviews', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('gig_dispute_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->string('status', 24)->index();
            $table->string('model', 191);
            $table->string('prompt_version', 32);
            $table->string('schema_version', 32);
            $table->text('failure_detail')->nullable();
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('processing_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('repair_attempted_at')->nullable();
            $table->json('snapshot')->nullable();
            $table->json('evidence_catalog')->nullable();
            $table->json('coverage')->nullable();
            $table->json('result')->nullable();
            $table->timestamps();

            $table->index(['status', 'queued_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_dispute_ai_overviews');
    }
};
