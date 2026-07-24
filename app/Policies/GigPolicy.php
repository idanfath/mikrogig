<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class GigPolicy
{
    // can apply: freelancer, not the client of the gig
    public function apply(User $user, Gig $gig): bool
    {
        return $user->role === UserRole::Freelancer && $user->id !== $gig->client_id;
    }

    // can cancel: client, the client of the gig
    public function cancel(User $user, Gig $gig): Response
    {
        return $user->role === UserRole::Client && $user->id === $gig->client_id
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
