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
        Schema::create('gig_disputes', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('gig_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('gig_agreement_id')->unique()->constrained('gig_agreements')->restrictOnDelete();
            $table->foreignId('gig_payment_id')->unique()->constrained('gig_payments')->restrictOnDelete();
            $table->foreignId('reporter_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('respondent_id')->constrained('users')->restrictOnDelete();
            $table->string('type', 50);
            $table->string('status', 50);
            $table->timestamp('opened_at');
            $table->timestamp('counterproof_due_at');
            $table->string('finding', 50)->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'counterproof_due_at']);
            $table->index(['status', 'opened_at']);
            $table->index(['reporter_id', 'status']);
            $table->index(['respondent_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_disputes');
    }
};
