<?php

namespace App\Events;

use App\Enums\GigRealtimeChange;
use App\Enums\GigStatus;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GigStateChanged implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<int, int>  $recipientIds
     */
    public function __construct(
        public int $gigId,
        public GigRealtimeChange $change,
        public GigStatus $status,
        public array $recipientIds,
        public string $occurredAt,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return collect($this->recipientIds)
            ->unique()
            ->map(fn (int $userId): PrivateChannel => new PrivateChannel('App.Models.User.'.$userId))
            ->values()
            ->all();
    }

    public function broadcastAs(): string
    {
        return 'gig.state.changed';
    }

    /**
     * @return array<string, int|string>
     */
    public function broadcastWith(): array
    {
        return [
            'gig_id' => $this->gigId,
            'change' => $this->change->value,
            'status' => $this->status->value,
            'occurred_at' => $this->occurredAt,
        ];
    }
}
