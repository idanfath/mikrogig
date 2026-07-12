<?php

namespace App\Services;

use App\Enums\NotificationTargetType;
use App\Models\User;
use App\Models\UserBan;
use Carbon\CarbonInterface;

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
    if ($target->id === $admin->id) {
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

    $this->notifications->send(
      createdBy: $admin ? $admin->id : null,
      title: 'You have been banned',
      targetType: NotificationTargetType::User,
      body: "You have been banned for the following reason: {$reason}" . ($until ? " Ban will be lifted at {$until}." : ''),
      recipientIds: [$target->id],
      sendEmail: $this->sendEmail
    );

    return $ban;
  }

  public function unban(User $target, ?User $admin = null): bool
  {
    $ban = $target->activeBan;

    if (!$ban)
      return false;

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

    if (!$ban) {
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
}
