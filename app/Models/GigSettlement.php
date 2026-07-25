<?php

namespace App\Models;

use App\Enums\GigSettlementOutcome;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['total_amount', 'freelancer_payout', 'client_refund', 'outcome', 'recorded_at'])]
class GigSettlement extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['total_amount' => 'integer', 'freelancer_payout' => 'integer', 'client_refund' => 'integer', 'outcome' => GigSettlementOutcome::class, 'recorded_at' => 'datetime'];
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(GigPayment::class, 'gig_payment_id');
    }

    public function exitRequest(): BelongsTo
    {
        return $this->belongsTo(GigExitRequest::class, 'gig_exit_request_id');
    }

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(GigDispute::class, 'gig_dispute_id');
    }
}
