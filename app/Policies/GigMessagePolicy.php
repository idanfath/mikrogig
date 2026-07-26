<?php

namespace App\Policies;

use App\Models\GigMessage;
use App\Models\GigMessageMedia;
use App\Models\User;
use App\Services\GigConversationService;
use Illuminate\Auth\Access\Response;

class GigMessagePolicy
{
    public function __construct(private GigConversationService $conversations) {}

    public function view(User $user, GigMessage $gigMessage): Response
    {
        return $this->conversations->canView($user, $gigMessage->agreement)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function viewMedia(User $user, GigMessageMedia $media): Response
    {
        return $this->conversations->canView($user, $media->message->agreement)
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
