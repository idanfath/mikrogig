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
        Schema::create('gig_settlements', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('gig_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('gig_payment_id')->unique()->constrained('gig_payments')->restrictOnDelete();
            $table->foreignId('gig_exit_request_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->foreignId('gig_dispute_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('total_amount');
            $table->unsignedBigInteger('freelancer_payout');
            $table->unsignedBigInteger('client_refund');
            $table->string('outcome', 50);
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['outcome', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_settlements');
    }
};
