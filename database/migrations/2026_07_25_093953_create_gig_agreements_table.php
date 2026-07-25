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
        Schema::create('gig_agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gig_id')->constrained()->restrictOnDelete();
            $table->foreignId('gig_offer_id')->constrained('gig_offers')->restrictOnDelete();
            $table->unsignedBigInteger('accepted_fee');
            $table->text('final_scope')->nullable();
            $table->date('work_date')->nullable();
            $table->time('start_time')->nullable();
            $table->text('location_arrangement')->nullable();
            $table->text('delivery_expectations')->nullable();
            $table->unsignedBigInteger('final_total_price')->nullable();
            $table->unsignedInteger('terms_version')->default(0);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('change_requested_at')->nullable();
            $table->timestamp('freelancer_confirmed_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->text('latest_change_request_note')->nullable();
            $table->string('closure_reason', 50)->nullable();
            $table->timestamps();

            $table->index(['gig_id', 'closed_at', 'id']);
            $table->index(['gig_offer_id', 'closed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_agreements');
    }
};
