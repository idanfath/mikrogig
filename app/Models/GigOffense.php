<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['sequence', 'duration_days'])]
class GigOffense extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['sequence' => 'integer', 'duration_days' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function exitRequest(): BelongsTo
    {
        return $this->belongsTo(GigExitRequest::class, 'gig_exit_request_id');
    }

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(GigDispute::class, 'gig_dispute_id');
    }

    public function ban(): BelongsTo
    {
        return $this->belongsTo(UserBan::class, 'user_ban_id');
    }
}
