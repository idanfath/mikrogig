<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('notification_recipients', function (Blueprint $table) {
      $table->id();
      $table
        ->foreignId('notification_id')
        ->constrained()
        ->onDelete('cascade');  // if a notification is deleted, will also get deleted from recipients inbox
      $table->foreignId('user_id')->constrained();
      $table->timestamp('read_at')->nullable();
      $table->timestamps();
      $table->unique(['notification_id', 'user_id']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('notification_recipients');
  }
};
