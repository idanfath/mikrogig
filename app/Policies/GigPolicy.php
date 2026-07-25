<?php

namespace App\Policies;

use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class GigPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Freelancer;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Client;
    }

    public function view(User $user, Gig $gig): Response
    {
        if ($user->role === UserRole::Client && $gig->client_id === $user->id) {
            return Response::allow();
        }

        if ($user->role === UserRole::Freelancer && ($gig->status === GigStatus::Open || $gig->offers()->forFreelancer($user->id)->exists())) {
            return Response::allow();
        }

        return Response::denyAsNotFound();
    }

    public function viewOwned(User $user): bool
    {
        return $user->role === UserRole::Client;
    }

    public function viewApplicants(User $user, Gig $gig): Response
    {
        return $user->role === UserRole::Client && $gig->client_id === $user->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function apply(User $user, Gig $gig): bool
    {
        return $user->role === UserRole::Freelancer && $user->id !== $gig->client_id;
    }

    public function cancel(User $user, Gig $gig): Response
    {
        return $user->role === UserRole::Client && $user->id === $gig->client_id
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
