<?php

namespace App\Policies;

use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\GigDispute;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class GigDisputePolicy
{
    public function viewAny(User $user): Response
    {
        return $user->role === UserRole::Admin ? Response::allow() : Response::denyAsNotFound();
    }

    public function view(User $user, GigDispute $dispute): Response
    {
        $isParticipant = in_array($user->id, [$dispute->reporter_id, $dispute->respondent_id], true);
        if ($user->activeBan()->exists()) {
            return $isParticipant && $dispute->gig()->whereIn('status', [
                GigStatus::Completed,
                GigStatus::Cancelled,
                GigStatus::DisputeResolved,
            ])->exists()
                ? Response::allow()
                : Response::denyAsNotFound();
        }

        return $user->role === UserRole::Admin || $isParticipant
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function counterproof(User $user, GigDispute $dispute): Response
    {
        return $user->id === $dispute->respondent_id ? Response::allow() : Response::denyAsNotFound();
    }

    public function resolve(User $user, GigDispute $dispute): Response
    {
        return $user->role === UserRole::Admin ? Response::allow() : Response::denyAsNotFound();
    }
}
