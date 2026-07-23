<?php

namespace App\Actions;

use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\User;
use App\Services\NotificationService;

final class RegisterUserAction
{
  public function __construct(
    private NotificationService $notificationService
  ) {}

  public function execute(array $data): User
  {
    $user = User::create($data);

    if (method_exists($user, 'sendEmailVerificationNotification')) {
      $user->sendEmailVerificationNotification();
    }

    $this->notificationService->send(
      title: 'Selamat Bergabung!',
      targetType: NotificationTargetType::User,
      createdBy: null,
      body: 'Selamat bergabung! Profil Anda berhasil disiapkan. Sekarang Anda siap' . ($user->role === UserRole::Freelancer ? ' mencari pekerjaan' : ' menawarkan keahlian') . ' di platform kami.',
      recipientIds: [$user->id]
    );

    return $user;
  }
}
