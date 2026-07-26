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
        Schema::create('gig_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gig_agreement_id')->constrained()->restrictOnDelete();
            $table->foreignId('sender_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('recipient_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('kind', 20);
            $table->string('body', 2000)->nullable();
            $table->string('workflow_event', 64)->nullable();
            $table->string('event_key', 191)->nullable();
            $table->json('event_snapshot')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['gig_agreement_id', 'id']);
            $table->index(['recipient_id', 'read_at']);
            $table->unique(['gig_agreement_id', 'event_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_messages');
    }
};
