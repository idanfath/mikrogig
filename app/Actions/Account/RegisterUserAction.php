<?php

namespace App\Actions\Account;

use App\Models\User;

final class RegisterUserAction
{
    public function execute(array $data): User
    {
        $user = User::create($data);

        $user->sendEmailVerificationNotification();

        app(SendUserOnboardingNotifications::class)->execute($user);

        return $user;
    }
}
