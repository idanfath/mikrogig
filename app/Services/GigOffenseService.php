<?php

namespace App\Services;

use App\Models\Gig;
use App\Models\GigDispute;
use App\Models\GigExitRequest;
use App\Models\GigOffense;
use App\Models\User;

final class GigOffenseService
{
    public function __construct(private BanService $bans) {}

    public function record(User $user, Gig $gig, ?GigExitRequest $exitRequest = null, ?GigDispute $dispute = null): GigOffense
    {
        $existing = GigOffense::query()
            ->when($exitRequest !== null, fn ($query) => $query->where('gig_exit_request_id', $exitRequest->id))
            ->when($dispute !== null, fn ($query) => $query->where('gig_dispute_id', $dispute->id))
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        $sequence = GigOffense::query()->where('user_id', $user->id)->count() + 1;
        $duration = $sequence === 1 ? 3 : ($sequence === 2 ? 7 : 30);
        $offense = new GigOffense(['sequence' => $sequence, 'duration_days' => $duration]);
        $offense->user()->associate($user);
        $offense->gig()->associate($gig);
        if ($exitRequest !== null) {
            $offense->exitRequest()->associate($exitRequest);
        }
        if ($dispute !== null) {
            $offense->dispute()->associate($dispute);
        }
        $offense->save();

        $ban = $this->bans->recordAutomated($user, "Pelanggaran gig otomatis #{$sequence}", $duration);
        if ($ban === null) {
            return $offense->refresh();
        }

        $offense->user_ban_id = $ban->id;
        $offense->save();

        return $offense->refresh();
    }
}
