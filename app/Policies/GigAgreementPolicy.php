<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\GigAgreement;
use App\Models\User;
use App\Services\GigConversationService;
use Illuminate\Auth\Access\Response;

class GigAgreementPolicy
{
    public function __construct(private GigConversationService $conversations) {}

    public function view(User $user, GigAgreement $agreement): Response
    {
        if ($user->role === UserRole::Client && $agreement->gig->client_id === $user->id) {
            return Response::allow();
        }

        if ($user->role === UserRole::Freelancer && $agreement->acceptedOffer->freelancer_id === $user->id) {
            return Response::allow();
        }

        return Response::denyAsNotFound();
    }

    public function submit(User $user, GigAgreement $agreement): Response
    {
        return $user->role === UserRole::Client && $agreement->gig->client_id === $user->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function respond(User $user, GigAgreement $agreement): Response
    {
        return $user->role === UserRole::Freelancer && $agreement->acceptedOffer->freelancer_id === $user->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function rejectSelected(User $user, GigAgreement $agreement): Response
    {
        return $this->submit($user, $agreement);
    }

    public function viewConversation(User $user, GigAgreement $agreement): Response
    {
        return $this->conversations->canView($user, $agreement)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function sendMessage(User $user, GigAgreement $agreement): Response
    {
        return $this->conversations->canSend($user, $agreement)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function markMessagesRead(User $user, GigAgreement $agreement): Response
    {
        return $this->conversations->canMarkRead($user, $agreement)
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
