<?php

use App\Enums\NotificationTargetType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('notifications', function (Blueprint $table) {
      $table->id();
      $table->foreignId('created_by')->nullable()->constrained('users');
      $table->string('title');
      $table->text('body');
      $table->enum('target_type', NotificationTargetType::values())->default(NotificationTargetType::defaultValue());
      $table->string('action_url')->nullable();  // can be "/reports/123" or "https://external.com/page"
      $table->string('action_label')->nullable();  // label for the action button, e.g. "View Report"
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('notifications');
  }
};
