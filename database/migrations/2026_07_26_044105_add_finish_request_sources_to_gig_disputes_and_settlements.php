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
        Schema::table('gig_disputes', function (Blueprint $table) {
            $table->foreignId('gig_finish_request_id')
                ->nullable()
                ->unique()
                ->after('gig_payment_id')
                ->constrained('gig_finish_requests')
                ->nullOnDelete();
        });

        Schema::table('gig_settlements', function (Blueprint $table) {
            $table->foreignId('gig_finish_request_id')
                ->nullable()
                ->unique()
                ->after('gig_dispute_id')
                ->constrained('gig_finish_requests')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gig_settlements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('gig_finish_request_id');
        });

        Schema::table('gig_disputes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('gig_finish_request_id');
        });
    }
};
