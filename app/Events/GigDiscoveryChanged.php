<?php

namespace App\Events;

use App\Enums\GigDiscoveryChange;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GigDiscoveryChanged implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $gigId,
        public GigDiscoveryChange $change,
        public bool $discoverable,
        public ?int $pendingApplicantsCount,
        public string $occurredAt,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('gigs.discovery'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'gig.discovery.changed';
    }

    /**
     * @return array<string, bool|int|string|null>
     */
    public function broadcastWith(): array
    {
        return [
            'gig_id' => $this->gigId,
            'change' => $this->change->value,
            'discoverable' => $this->discoverable,
            'pending_applicants_count' => $this->pendingApplicantsCount,
            'occurred_at' => $this->occurredAt,
        ];
    }
}
