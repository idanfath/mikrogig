<?php

namespace App\Models;

use Database\Factories\GigRatingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['score', 'comment'])]
class GigRating extends Model
{
    /** @use HasFactory<GigRatingFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'score' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn (): never => throw new \LogicException('Gig ratings are immutable.'));
        static::deleting(fn (): never => throw new \LogicException('Gig ratings are immutable.'));
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function rater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rater_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}
