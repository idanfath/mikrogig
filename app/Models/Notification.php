<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;

#[Guarded(['id'])]
class Notification extends Model
{
  public function sender()
  {
    return $this->belongsTo(User::class, 'created_by');
  }

  public function recipients()
  {
    return $this->hasMany(NotificationRecipient::class);
  }
}
