<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;

#[Guarded(['id'])]
class NotificationRecipient extends Model
{
  // might wanna cast 'read_at' to datetime
  public function notification()
  {
    return $this->belongsTo(Notification::class);
  }

  public function user()
  {
    return $this->belongsTo(User::class, 'user_id');
  }
}
