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
        Schema::create('gig_message_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gig_message_id')->constrained()->restrictOnDelete();
            $table->string('path');
            $table->string('mime_type', 50);
            $table->unsignedTinyInteger('display_order');
            $table->timestamps();

            $table->unique(['gig_message_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_message_media');
    }
};
