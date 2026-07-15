<?php

namespace App\Observers;

use App\Enums\NotificationTargetType;
use App\Models\User;
use App\Services\NotificationService;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        app(NotificationService::class)->send(
            title: 'Selamat Bergabung!',
            targetType: NotificationTargetType::User,
            createdBy: null,
            body: 'Selamat bergabung! Profil Anda berhasil disiapkan. Sekarang Anda siap menawarkan keahlian atau mencari pekerjaan di platform kami.',
            recipientIds: [$user->id]
        );
    }
}
