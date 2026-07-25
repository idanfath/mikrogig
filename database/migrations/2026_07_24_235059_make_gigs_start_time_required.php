<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gigs', function (Blueprint $table): void {
            $table->time('start_time')->change();
        });
    }

    public function down(): void
    {
        Schema::table('gigs', function (Blueprint $table): void {
            $table->time('start_time')->nullable()->change();
        });
    }
};
