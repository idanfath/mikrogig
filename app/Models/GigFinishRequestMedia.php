<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['path'])]
class GigFinishRequestMedia extends Model
{
    use HasFactory;

    protected $table = 'gig_finish_request_media';

    public function finishRequest(): BelongsTo
    {
        return $this->belongsTo(GigFinishRequest::class, 'gig_finish_request_id');
    }
}
