<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\GigOffer;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class GigOfferPolicy
{
    // can withdraw: freelancer, the freelancer of the gig offer
    public function withdraw(User $user, GigOffer $gigOffer): Response
    {
        return $user->role === UserRole::Freelancer && $user->id === $gigOffer->freelancer_id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function reject(User $user, GigOffer $gigOffer): Response
    {
        return $this->managesGig($user, $gigOffer);
    }

    public function accept(User $user, GigOffer $gigOffer): Response
    {
        return $this->managesGig($user, $gigOffer);
    }

    private function managesGig(User $user, GigOffer $gigOffer): Response
    {
        $gig = $gigOffer->gig;

        return $gig !== null && $user->role === UserRole::Client && $user->id === $gig->client_id
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
