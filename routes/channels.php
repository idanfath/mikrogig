<?php

use App\Models\GigAgreement;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('gig-conversations.{agreementId}', function (User $user, int $agreementId): array|false {
    $agreement = GigAgreement::query()->find($agreementId);

    if ($agreement === null || ! $user->can('viewConversation', $agreement)) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar_url' => $user->avatar_url,
    ];
});
