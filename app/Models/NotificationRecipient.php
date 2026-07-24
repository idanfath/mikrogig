<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;

#[Guarded(['id'])]
class NotificationRecipient extends Model
{
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function notification()
    {
        return $this->belongsTo(Notification::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeForUser($query, int $userId)
    {
        $query->where('user_id', $userId);
    }

    public function scopeForNotification($query, int $notificationId)
    {
        $query->where('notification_id', $notificationId);
    }

    public function scopeUnread($query)
    {
        $query->whereNull('read_at');
    }
}
