<?php

namespace App\Models;

use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['type', 'opened_at', 'counterproof_due_at', 'finding', 'resolution_note', 'resolved_at'])]
class GigDispute extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['type' => GigDisputeType::class, 'status' => GigDisputeStatus::class, 'opened_at' => 'datetime', 'counterproof_due_at' => 'datetime', 'finding' => GigDisputeFinding::class, 'resolved_at' => 'datetime'];
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function agreement(): BelongsTo
    {
        return $this->belongsTo(GigAgreement::class, 'gig_agreement_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(GigPayment::class, 'gig_payment_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function respondent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'respondent_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(GigDisputeSubmission::class);
    }

    public function settlement(): HasOne
    {
        return $this->hasOne(GigSettlement::class);
    }

    public function scopeAwaitingCounterproof(Builder $query): Builder
    {
        return $query->where('status', GigDisputeStatus::AwaitingCounterproof);
    }

    public function scopeAwaitingAdmin(Builder $query): Builder
    {
        return $query->where('status', GigDisputeStatus::AwaitingAdmin);
    }
}
