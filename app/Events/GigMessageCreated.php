<?php

namespace App\Events;

use App\Enums\GigMessageKind;
use App\Http\Resources\GigMessageResource;
use App\Models\GigMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Queue\SerializesModels;

class GigMessageCreated implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public GigMessage $message) {}

    /**
     * @return array<int, PresenceChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('gig-conversations.'.$this->message->gig_agreement_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'gig.message.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        if ($this->message->kind === GigMessageKind::System) {
            return [
                'kind' => GigMessageKind::System->value,
                'message_id' => $this->message->id,
            ];
        }

        $this->message->loadMissing(['sender', 'media']);

        return [
            'kind' => GigMessageKind::User->value,
            'message' => GigMessageResource::make($this->message)->resolve(new Request),
        ];
    }
}
