<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['path'])]
class GigDisputeMedia extends Model
{
    use HasFactory;

    public function submission(): BelongsTo
    {
        return $this->belongsTo(GigDisputeSubmission::class, 'gig_dispute_submission_id');
    }
}
