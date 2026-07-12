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
    Schema::create('user_bans', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->foreignId('banned_by')->nullable()->constrained('users')->nullOnDelete();
      $table->foreignId('unbanned_by')->nullable()->constrained('users')->nullOnDelete();
      $table->string('reason')->nullable();
      $table->timestamp('banned_at');
      $table->timestamp('banned_until')->nullable();  // null = permanent
      $table->timestamp('unbanned_at')->nullable();  // null = still active
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('user_bans');
  }
};
