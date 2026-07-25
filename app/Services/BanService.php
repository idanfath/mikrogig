<?php

namespace App\Services;

use App\Enums\NotificationTargetType;
use App\Models\User;
use App\Models\UserBan;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Throwable;

// possible future features:
// - move notification to ban models observe (but find a way not to send emails when banning from seeder)
class BanService
{
    public function __construct(
        private NotificationService $notifications,
        private bool $sendEmail = true
    ) {}

    public function ban(User $target, ?User $admin = null, ?string $reason = null, ?CarbonInterface $until = null): UserBan
    {
        if ($admin !== null && $target->id === $admin->id) {
            throw new \Exception('You cannot ban yourself.');
        }

        if ($target->is_banned) {
            throw new \Exception('User is already banned.');
        }

        $ban = UserBan::create([
            'user_id' => $target->id,
            'banned_by' => $admin ? $admin->id : null,
            'reason' => $reason,
            'banned_at' => now(),
            'banned_until' => $until,
        ]);

        $this->notifySafely($ban, $admin?->id);

        return $ban;
    }

    public function recordAutomated(User $target, string $reason, int $durationDays): ?UserBan
    {
        $activeBan = $target->activeBan()->lockForUpdate()->first();
        if ($activeBan !== null && $activeBan->banned_until === null) {
            return null;
        }

        $startsAt = $activeBan?->banned_until !== null && $activeBan->banned_until->isFuture()
            ? $activeBan->banned_until
            : now();

        $ban = UserBan::query()->create([
            'user_id' => $target->id,
            'banned_by' => null,
            'reason' => $reason,
            'banned_at' => now(),
            'banned_until' => $startsAt->copy()->addDays($durationDays),
        ]);

        $notify = fn () => $this->notifySafely($ban);

        if (DB::transactionLevel() > 0) {
            DB::afterCommit($notify);
        } else {
            $notify();
        }

        return $ban;
    }

    public function unban(User $target, ?User $admin = null): bool
    {
        $ban = $target->activeBan;

        if (! $ban) {
            return false;
        }

        $ban->update([
            'unbanned_at' => now(),
            'unbanned_by' => $admin ? $admin->id : null,
        ]);

        $this->notifications->send(
            createdBy: $admin ? $admin->id : null,
            title: 'Your ban has been lifted',
            targetType: NotificationTargetType::User,
            body: 'Your ban has been lifted. Please adhere to the community guidelines to avoid future bans.',
            recipientIds: [$target->id],
            sendEmail: $this->sendEmail
        );

        return true;
    }

    public function extend(User $target, CarbonInterface $newUntil, ?User $admin = null): bool
    {
        $ban = $target->activeBan;

        if (! $ban) {
            throw new \Exception('User has no active ban to extend.');
        }

        $ban->update(['banned_until' => $newUntil]);

        $this->notifications->send(
            createdBy: $admin ? $admin->id : null,
            title: 'Your ban has been extended',
            targetType: NotificationTargetType::User,
            body: "Your ban has been extended until {$newUntil}. Please adhere to the community guidelines to avoid future bans.",
            recipientIds: [$target->id],
            sendEmail: true
        );

        return true;
    }

    private function notifySafely(UserBan $ban, ?int $createdBy = null): void
    {
        try {
            $reason = $ban->reason ?: 'Tidak ada alasan yang dicantumkan';
            $status = $ban->banned_until === null
                ? 'Penangguhan berlaku permanen.'
                : 'Penangguhan berakhir pada '.$ban->banned_until
                    ->timezone(config('app.timezone'))
                    ->toIso8601String().'.';

            $this->notifications->send(
                title: 'Akun ditangguhkan',
                targetType: NotificationTargetType::User,
                createdBy: $createdBy,
                body: "Alasan: {$reason}. {$status}",
                recipientIds: [$ban->user_id],
                action_url: route('app.suspension'),
                action_label: 'Lihat Penangguhan',
                sendEmail: $this->sendEmail,
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
