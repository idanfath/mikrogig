<?php

namespace App\Models;

use Database\Factories\GigMessageMediaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['path', 'mime_type', 'display_order'])]
class GigMessageMedia extends Model
{
    /** @use HasFactory<GigMessageMediaFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['display_order' => 'integer'];
    }

    protected static function booted(): void
    {
        static::updating(fn (): never => throw new LogicException('Gig message media is immutable.'));
        static::deleting(fn (): never => throw new LogicException('Gig message media is immutable.'));
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(GigMessage::class, 'gig_message_id');
    }
}
