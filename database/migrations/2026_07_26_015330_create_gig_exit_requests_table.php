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
        Schema::create('gig_exit_requests', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('gig_id')->constrained()->restrictOnDelete();
            $table->foreignId('requester_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('responder_id')->constrained('users')->restrictOnDelete();
            $table->string('type', 50);
            $table->text('reason');
            $table->string('status', 32);
            $table->string('response', 32)->nullable();
            $table->string('execution_mode', 32)->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();

            $table->index(['gig_id', 'status']);
            $table->index(['requester_id', 'status']);
            $table->index(['responder_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_exit_requests');
    }
};
