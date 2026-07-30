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
        Schema::table('gigs', function (Blueprint $table) {
            $table->string('estimated_duration', 30)->after('start_time');
            $table->unsignedBigInteger('wage_benchmark_minimum')->after('posted_fee');
            $table->unsignedBigInteger('wage_benchmark_maximum')->after('wage_benchmark_minimum');
            $table->unsignedSmallInteger('wage_benchmark_year')->after('wage_benchmark_maximum');
        });

        Schema::table('gig_agreements', function (Blueprint $table) {
            $table->string('estimated_duration', 30)->after('accepted_fee');
            $table->unsignedBigInteger('wage_benchmark_minimum')->after('final_total_price');
            $table->unsignedBigInteger('wage_benchmark_maximum')->after('wage_benchmark_minimum');
            $table->unsignedSmallInteger('wage_benchmark_year')->after('wage_benchmark_maximum');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gig_agreements', function (Blueprint $table) {
            $table->dropColumn([
                'estimated_duration',
                'wage_benchmark_minimum',
                'wage_benchmark_maximum',
                'wage_benchmark_year',
            ]);
        });

        Schema::table('gigs', function (Blueprint $table) {
            $table->dropColumn([
                'estimated_duration',
                'wage_benchmark_minimum',
                'wage_benchmark_maximum',
                'wage_benchmark_year',
            ]);
        });
    }
};
