<?php

namespace App\Events;

use App\Models\GigAgreement;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GigMessagesRead implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public GigAgreement $agreement,
        public int $readerId,
    ) {}

    /**
     * @return array<int, PresenceChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('gig-conversations.'.$this->agreement->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'gig.messages.read';
    }

    /**
     * @return array{reader_id: int}
     */
    public function broadcastWith(): array
    {
        return ['reader_id' => $this->readerId];
    }
}
