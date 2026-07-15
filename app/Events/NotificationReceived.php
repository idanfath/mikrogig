<?php

namespace App\Events;

use App\Models\NotificationRecipient;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public NotificationRecipient $recipient
    ) {
        $this->recipient->load('notification');
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.'.$this->recipient->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.received';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->recipient->notification_id,
            'title' => $this->recipient->notification->title,
            'body' => $this->recipient->notification->body,
            'action_url' => $this->recipient->notification->action_url,
            'action_label' => $this->recipient->notification->action_label,
            'created_at' => $this->recipient->created_at->diffForHumans(),
            'read_at' => $this->recipient->read_at,
        ];
    }
}
