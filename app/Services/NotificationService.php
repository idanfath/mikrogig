<?php

namespace App\Services;

use App\Enums\NotificationTargetType;
use App\Events\NotificationReceived;
use App\Jobs\SendMailJob;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// known performance bottlenecks:
// - we still brings ids to php, but we can optimize by doing insert with select in pure sql, but it will be more complex to handle email sending
// - queue probably not optimized enough
// probably will hold up for now as im not even sure we'll have more than 100 users.
class NotificationService
{
    public function __construct(
        private MailService $mailService
    ) {}

    public function send(
        string $title,
        NotificationTargetType $targetType,
        ?int $createdBy,
        ?string $body = null,
        ?array $recipientIds = null,
        ?string $role = null,
        ?string $action_url = null,
        ?string $action_label = null,
        ?bool $sendEmail = false
    ): void {
        $notification = Notification::create([
            'created_by' => $createdBy,
            'title' => $title,
            'body' => $body,
            'target_type' => $targetType->value,
            'action_url' => $action_url,
            'action_label' => $action_label,
        ]);

        // Start query for recipients based on target type
        $query = $this->recipientQuery($targetType, $recipientIds, $role);

        $emailData = $this->mailService::buildEmailData(
            subject: $notification->title,
            body: $notification->body,
            actionUrl: $notification->action_url,
            actionLabel: $notification->action_label
        );

        $query->select(['id', 'email'])->chunkById(100, function ($users) use ($notification, $sendEmail, $emailData) {
            $recipientRows = [];
            foreach ($users as $user) {
                $recipientRows[] = [
                    'notification_id' => $notification->id,
                    'user_id' => $user->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if ($sendEmail) {
                    SendMailJob::dispatch($user->email, $notification->title, $emailData);
                }
            }

            DB::transaction(fn () => NotificationRecipient::insert($recipientRows));

            $recipients = NotificationRecipient::where('notification_id', $notification->id)
                ->whereIn('user_id', $users->pluck('id'))
                ->get();

            foreach ($recipients as $recipient) {
                broadcast(new NotificationReceived($recipient))->toOthers();
            }
        });
    }

    public function inbox(int $userId, int $perPage = 20, ?string $search = null)
    {
        $query = Notification::query()
            ->join('notification_recipients', 'notifications.id', '=', 'notification_recipients.notification_id')
            ->where('notification_recipients.user_id', $userId);

        if ($search) {
            $query->where(fn ($q) => $q
                ->where('notifications.title', 'like', "%{$search}%")
                ->orWhere('notifications.body', 'like', "%{$search}%")
            );
        }

        $notifications = $query
            ->select([
                'notifications.*',
                'notifications.id as id',
                'notification_recipients.read_at',
            ])
            ->orderBy('notifications.created_at', 'desc')
            ->orderBy('notifications.id', 'desc')  // Fallback for identical timestamps
            ->paginate($perPage);

        $notifications->getCollection()->transform(fn ($n) => [
            'id' => $n->id,
            'title' => $n->title,
            'body' => $n->body,
            'action_url' => $n->action_url,
            'action_label' => $n->action_label,
            'created_at' => $n->created_at,
            'read_at' => $n->read_at,
            'sent_at' => $n->created_at,
        ]);

        return $notifications;
    }

    public function markRead(int $userId, int $notificationId): void
    {
        NotificationRecipient::where('notification_id', $notificationId)
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function markAllAsRead(int $userId): void
    {
        NotificationRecipient::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function delete(int $userId, int $notificationId): void
    {
        NotificationRecipient::where('notification_id', $notificationId)
            ->where('user_id', $userId)
            ->delete();
    }

    public function unreadCount(int $userId): int
    {
        return NotificationRecipient::where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    private function recipientQuery(
        NotificationTargetType $targetType,
        ?array $recipientIds = null,
        ?string $role = null
    ) {
        return match ($targetType) {
            NotificationTargetType::Everyone => User::query(),
            NotificationTargetType::Role => User::where('role', $role),
            NotificationTargetType::Users => User::whereIn('id', $recipientIds ?? []),
            NotificationTargetType::User => User::where('id', $recipientIds[0] ?? null),
            default => User::query()->whereRaw('1 = 0'),
        };
    }
}
