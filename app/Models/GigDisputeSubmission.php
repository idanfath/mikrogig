<?php

namespace App\Models;

use App\Enums\GigDisputeSubmissionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['type', 'statement', 'submitted_at'])]
class GigDisputeSubmission extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['type' => GigDisputeSubmissionType::class, 'submitted_at' => 'datetime'];
    }

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(GigDispute::class, 'gig_dispute_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function media(): HasMany
    {
        return $this->hasMany(GigDisputeMedia::class)->orderBy('id');
    }
}
