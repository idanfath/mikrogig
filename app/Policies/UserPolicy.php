<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    public function view(User $viewer, User $profile): Response
    {
        if (
            $profile->onboarding_step !== null
            || ! $profile->hasVerifiedEmail()
            || $profile->is_banned
        ) {
            return Response::denyAsNotFound();
        }

        return Response::allow();
    }
}
