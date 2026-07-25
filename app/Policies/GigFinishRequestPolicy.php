<?php

namespace App\Policies;

use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\GigFinishRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class GigFinishRequestPolicy
{
    public function view(User $user, GigFinishRequest $finishRequest): Response
    {
        $isParticipant = in_array($user->id, [
            $finishRequest->freelancer_id,
            $finishRequest->gig()->value('client_id'),
        ], true);

        if ($user->activeBan()->exists()) {
            return $isParticipant && $finishRequest->gig()->whereIn('status', [
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

    public function accept(User $user, GigFinishRequest $finishRequest): Response
    {
        return $user->role === UserRole::Client
            && $user->id === $finishRequest->gig()->value('client_id')
                ? Response::allow()
                : Response::denyAsNotFound();
    }

    public function reject(User $user, GigFinishRequest $finishRequest): Response
    {
        return $this->accept($user, $finishRequest);
    }
}
