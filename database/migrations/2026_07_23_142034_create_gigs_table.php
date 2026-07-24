<?php

use App\Enums\GigStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gigs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->restrictOnDelete();
            //
            $table->string('title');
            $table->text('description');
            $table->string('category', 50);  // use string, but cast to enum, and validate so consistent
            $table->string('status', 50)->default(GigStatus::defaultValue());  // same
            //
            $table->string('province_id', 2);
            $table->string('regency_id', 4);
            $table->string('province_name');
            $table->string('regency_name');
            //
            $table->text('location_address');
            $table->decimal('location_latitude', 10, 7)->nullable();
            $table->decimal('location_longitude', 10, 7)->nullable();
            $table->unsignedInteger('location_accuracy_meters')->nullable();
            //
            $table->date('work_date');
            $table->time('start_time')->nullable();
            //
            $table->unsignedBigInteger('posted_fee');
            //
            $table->timestamp('started_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            //
            $table->softDeletes();
            $table->timestamps();
            // todo: once done implementing, check if index is still needed
            $table->index(['status', 'work_date']);
            $table->index(['province_id', 'regency_id']);
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gigs');
    }
};
