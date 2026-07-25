<?php

namespace App\Policies;

use App\Models\GigExitRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class GigExitRequestPolicy
{
    public function view(User $user, GigExitRequest $request): Response
    {
        return in_array($user->id, [$request->requester_id, $request->responder_id], true) ? Response::allow() : Response::denyAsNotFound();
    }

    public function respond(User $user, GigExitRequest $request): Response
    {
        return $user->id === $request->responder_id ? Response::allow() : Response::denyAsNotFound();
    }

    public function withdraw(User $user, GigExitRequest $request): Response
    {
        return $user->id === $request->requester_id ? Response::allow() : Response::denyAsNotFound();
    }

    public function proceed(User $user, GigExitRequest $request): Response
    {
        return $this->withdraw($user, $request);
    }
}
