<?php

namespace App\Models;

use App\Enums\GigPaymentStatus;
use Database\Factories\GigPaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'amount',
    'currency',
    'local_reference',
    'provider',
    'provider_reference',
    'checkout_url',
    'expires_at',
    'checkout_prepared_at',
    'provider_paid_at',
    'paid_at',
    'cancelled_at',
    'expired_at',
])]
class GigPayment extends Model
{
    /** @use HasFactory<GigPaymentFactory> */
    use HasFactory;

    protected $attributes = [
        'currency' => 'IDR',
        'status' => GigPaymentStatus::Pending->value,
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => GigPaymentStatus::class,
            'expires_at' => 'datetime',
            'checkout_prepared_at' => 'datetime',
            'provider_paid_at' => 'datetime',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'expired_at' => 'datetime',
        ];
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function agreement(): BelongsTo
    {
        return $this->belongsTo(GigAgreement::class, 'gig_agreement_id');
    }

    public function dispute(): HasOne
    {
        return $this->hasOne(GigDispute::class);
    }

    public function settlement(): HasOne
    {
        return $this->hasOne(GigSettlement::class);
    }

    public function finishRequests(): HasMany
    {
        return $this->hasMany(GigFinishRequest::class);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', GigPaymentStatus::Pending);
    }

    public function scopeExpiredDeadline(Builder $query): Builder
    {
        return $query->where('expires_at', '<=', now());
    }
}
