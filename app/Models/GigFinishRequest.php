<?php

namespace App\Models;

use App\Enums\GigFinishRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['completion_note', 'review_due_at', 'accepted_at', 'rejected_at', 'rejection_reason'])]
class GigFinishRequest extends Model
{
    use HasFactory;

    protected $attributes = [
        'status' => GigFinishRequestStatus::Pending->value,
    ];

    protected function casts(): array
    {
        return [
            'status' => GigFinishRequestStatus::class,
            'review_due_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(GigPayment::class, 'gig_payment_id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function media(): HasMany
    {
        return $this->hasMany(GigFinishRequestMedia::class)->orderBy('id');
    }

    public function settlement(): HasOne
    {
        return $this->hasOne(GigSettlement::class);
    }

    public function dispute(): HasOne
    {
        return $this->hasOne(GigDispute::class);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', GigFinishRequestStatus::Pending);
    }

    public function scopeReviewDue(Builder $query): Builder
    {
        return $query->pending()->where('review_due_at', '<=', now());
    }
}
