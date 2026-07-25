<?php

use App\Enums\GigPaymentStatus;
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
        Schema::create('gig_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gig_id')->constrained()->restrictOnDelete();
            $table->foreignId('gig_agreement_id')->unique()->constrained('gig_agreements')->restrictOnDelete();
            $table->unsignedBigInteger('amount');
            $table->char('currency', 3)->default('IDR');
            $table->string('local_reference', 64)->unique();
            $table->string('provider', 50);
            $table->string('provider_reference')->nullable();
            $table->text('checkout_url')->nullable();
            $table->string('status', 32)->default(GigPaymentStatus::Pending->value);
            $table->timestamp('expires_at');
            $table->timestamp('checkout_prepared_at')->nullable();
            $table->timestamp('provider_paid_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamps();

            $table->index(['provider', 'provider_reference']);
            $table->index(['status', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_payments');
    }
};
