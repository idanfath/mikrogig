<?php

namespace App\Models;

use App\Enums\GigAgreementClosureReason;
use Database\Factories\GigAgreementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'accepted_fee',
    'final_scope',
    'work_date',
    'start_time',
    'location_arrangement',
    'delivery_expectations',
    'final_total_price',
    'terms_version',
    'submitted_at',
    'change_requested_at',
    'freelancer_confirmed_at',
    'closed_at',
    'latest_change_request_note',
    'closure_reason',
])]
class GigAgreement extends Model
{
    /** @use HasFactory<GigAgreementFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'accepted_fee' => 'integer',
            'final_total_price' => 'integer',
            'terms_version' => 'integer',
            'work_date' => 'date',
            'submitted_at' => 'datetime',
            'change_requested_at' => 'datetime',
            'freelancer_confirmed_at' => 'datetime',
            'closed_at' => 'datetime',
            'closure_reason' => GigAgreementClosureReason::class,
        ];
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function acceptedOffer(): BelongsTo
    {
        return $this->belongsTo(GigOffer::class, 'gig_offer_id');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(GigPayment::class);
    }

    public function dispute(): HasOne
    {
        return $this->hasOne(GigDispute::class);
    }

    public function scopeForGig(Builder $query, Gig|int $gig): Builder
    {
        return $query->where('gig_id', $gig instanceof Gig ? $gig->id : $gig);
    }

    public function scopeForAcceptedOffer(Builder $query, GigOffer|int $offer): Builder
    {
        return $query->where('gig_offer_id', $offer instanceof GigOffer ? $offer->id : $offer);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNull('closed_at');
    }
}
