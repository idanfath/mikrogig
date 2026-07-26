<?php

namespace App\Models;

use App\Enums\GigMessageKind;
use App\Enums\GigWorkflowEvent;
use Database\Factories\GigMessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

#[Fillable(['body', 'kind', 'workflow_event', 'event_key', 'event_snapshot', 'read_at'])]
class GigMessage extends Model
{
    /** @use HasFactory<GigMessageFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'kind' => GigMessageKind::class,
            'workflow_event' => GigWorkflowEvent::class,
            'event_snapshot' => 'array',
            'read_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (GigMessage $message): void {
            if (array_diff(array_keys($message->getDirty()), ['read_at', 'updated_at']) !== []) {
                throw new LogicException('Gig messages are immutable.');
            }
        });
        static::deleting(fn (): never => throw new LogicException('Gig messages are immutable.'));
    }

    public function agreement(): BelongsTo
    {
        return $this->belongsTo(GigAgreement::class, 'gig_agreement_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(GigMessageMedia::class)->orderBy('display_order')->orderBy('id');
    }
}
