<?php

use App\Enums\GigOfferStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gig_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gig_id')->constrained('gigs')->restrictOnDelete();
            $table->foreignId('freelancer_id')->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('offered_fee');
            $table->text('note')->nullable();
            $table->enum('status', GigOfferStatus::values())->default(GigOfferStatus::defaultValue());
            $table->timestamps();

            // one offer per gig per worker, update if reoffer. pending -> withdrawn -> pending
            $table->unique(
                ['gig_id', 'freelancer_id'],
                'gig_offers_gig_freelancer_unique',
            );

            // index
            $table->index(
                ['gig_id', 'status'],
                'gig_offers_gig_status_index',
            );
            $table->index(
                ['freelancer_id', 'status'],
                'gig_offers_freelancer_status_index',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_offers');
    }
};
