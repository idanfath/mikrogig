<?php

namespace App\Models;

use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'offered_fee',
    'note',
])]
class GigOffer extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => GigOfferStatus::class,
            'offered_fee' => 'integer',
        ];
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    public function scopeForGig(Builder $query, int $gigId): void
    {
        $query->where('gig_id', $gigId);
    }

    public function scopeExceptGig(Builder $query, int $gigId): void
    {
        $query->where('gig_id', '!=', $gigId);
    }

    public function scopeForFreelancer(Builder $query, int $freelancerId): void
    {
        $query->where('freelancer_id', $freelancerId);
    }

    public function scopePending(Builder $query): void
    {
        $query->where('status', GigOfferStatus::PENDING);
    }

    public function scopeAccepted(Builder $query): void
    {
        $query->where('status', GigOfferStatus::ACCEPTED);
    }

    public function scopeActiveAccepted(Builder $query): void
    {
        $query
            ->accepted()
            ->whereHas('gig', fn (Builder $q) => $q->whereNotIn('status', [
                GigStatus::Completed,
                GigStatus::Cancelled,
            ]));
    }
}
