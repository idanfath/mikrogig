<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_recipients', function (Blueprint $table) {
            $table->index(['user_id', 'read_at'], 'notification_recipients_user_id_read_at_index');
        });

        Schema::table('user_bans', function (Blueprint $table) {
            $table->index(['user_id', 'unbanned_at', 'banned_until'], 'user_bans_user_id_unbanned_at_banned_until_index');
        });
    }

    public function down(): void
    {
        Schema::table('notification_recipients', function (Blueprint $table) {
            $table->dropIndex('notification_recipients_user_id_read_at_index');
        });

        Schema::table('user_bans', function (Blueprint $table) {
            $table->dropIndex('user_bans_user_id_unbanned_at_banned_until_index');
        });
    }
};
