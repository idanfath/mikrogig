<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\GigPayment;
use App\Models\User;
use Illuminate\Auth\Access\Response as AccessResponse;

class GigPaymentPolicy
{
    public function view(User $user, GigPayment $payment): AccessResponse
    {
        if ($user->role === UserRole::Client && $payment->gig->client_id === $user->id) {
            return AccessResponse::allow();
        }

        if ($user->role === UserRole::Freelancer
            && $payment->agreement->acceptedOffer->freelancer_id === $user->id) {
            return AccessResponse::allow();
        }

        return AccessResponse::denyAsNotFound();
    }

    public function checkout(User $user, GigPayment $payment): AccessResponse
    {
        return $user->role === UserRole::Client && $payment->gig->client_id === $user->id
            ? AccessResponse::allow()
            : AccessResponse::denyAsNotFound();
    }
}
