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
        Schema::table('users', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('role');
            $table->string('province_id', 2)->nullable()->after('date_of_birth');
            $table->string('regency_id', 4)->nullable()->after('province_id');
            $table->string('province_name')->nullable()->after('regency_id');
            $table->string('regency_name')->nullable()->after('province_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth',
                'province_id',
                'regency_id',
                'province_name',
                'regency_name',
            ]);
        });
    }
};
