<?php

namespace App\Models;

use App\Enums\GigExitDecision;
use App\Enums\GigExitExecutionMode;
use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['type', 'reason', 'response', 'execution_mode', 'responded_at', 'withdrawn_at', 'executed_at'])]
class GigExitRequest extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['type' => GigExitType::class, 'status' => GigExitStatus::class, 'response' => GigExitDecision::class, 'execution_mode' => GigExitExecutionMode::class, 'responded_at' => 'datetime', 'withdrawn_at' => 'datetime', 'executed_at' => 'datetime'];
    }

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [GigExitStatus::Pending, GigExitStatus::Refused]);
    }
}
