<?php

namespace App\Models;

use App\Enums\GigDisputeAiOverviewStatus;
use Database\Factories\GigDisputeAiOverviewFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'status',
    'model',
    'prompt_version',
    'schema_version',
    'failure_detail',
    'queued_at',
    'processing_at',
    'completed_at',
    'failed_at',
    'repair_attempted_at',
    'snapshot',
    'evidence_catalog',
    'coverage',
    'result',
])]
class GigDisputeAiOverview extends Model
{
    /** @use HasFactory<GigDisputeAiOverviewFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => GigDisputeAiOverviewStatus::Queued->value,
    ];

    protected function casts(): array
    {
        return [
            'status' => GigDisputeAiOverviewStatus::class,
            'queued_at' => 'datetime',
            'processing_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
            'repair_attempted_at' => 'datetime',
            'snapshot' => 'array',
            'evidence_catalog' => 'array',
            'coverage' => 'array',
            'result' => 'array',
        ];
    }

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(GigDispute::class, 'gig_dispute_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
