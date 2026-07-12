<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;

#[Guarded(['id'])]
class UserBan extends Model
{
  public function user()
  {
    return $this->belongsTo(User::class);
  }

  public function bannedBy()
  {
    return $this->belongsTo(User::class, 'banned_by');
  }

  public function unbannedBy()
  {
    return $this->belongsTo(User::class, 'unbanned_by');
  }

  public function isActive(): bool
  {
    // If unbanned_at is set, the ban is no longer active
    if ($this->unbanned_at)
      return false;
    // If banned_until is null, it's a permanent ban, so yes it's active
    if (is_null($this->banned_until))
      return true;
    // If banned_until is in the future, the ban is still active
    return now()->lessThan($this->banned_until);
  }
}
