<?php

namespace App\Actions;

use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\User;
use App\Services\NotificationService;

final class SendUserOnboardingNotifications
{
  public function __construct(
    private NotificationService $notificationService
  ) {}

  public function execute(User $user): void
  {
    $this->notificationService->send(
      title: 'Selamat Bergabung!',
      targetType: NotificationTargetType::User,
      createdBy: null,
      body: 'Selamat bergabung! Profil Anda berhasil disiapkan. Sekarang Anda siap' . ($user->role === UserRole::Freelancer ? ' mencari pekerjaan' : ' menawarkan keahlian') . ' di platform kami.',
      recipientIds: [$user->id]
    );

    if ($user->google_id && !$user->password) {
      $this->notificationService->send(
        title: 'Atur Kata Sandi Anda',
        targetType: NotificationTargetType::User,
        createdBy: null,
        body: 'Akun Anda didaftarkan melalui Google. Untuk keamanan tambahan, silakan atur kata sandi untuk akun Anda. Klik tombol di "Atur Kata Sandi" untuk mengatur kata sandi.',
        action_label: 'Atur Kata Sandi',
        action_url: route('app.account', absolute: false),
        recipientIds: [$user->id]
      );
    }
  }
}
