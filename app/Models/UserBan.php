<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Guarded(['id'])]
class UserBan extends Model
{
    protected function casts(): array
    {
        return [
            'banned_at' => 'datetime',
            'banned_until' => 'datetime',
            'unbanned_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bannedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'banned_by');
    }

    public function unbannedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'unbanned_by');
    }

    public function gigOffense(): HasOne
    {
        return $this->hasOne(GigOffense::class, 'user_ban_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->whereNull('unbanned_at')
            ->where(function ($q) {
                $q
                    ->whereNull('banned_until')
                    ->orWhere('banned_until', '>', now());
            });
    }

    public function isActive(): bool
    {
        if ($this->unbanned_at) {
            return false;
        }
        if (is_null($this->banned_until)) {
            return true;
        }

        return now()->lessThan($this->banned_until);
    }
}
