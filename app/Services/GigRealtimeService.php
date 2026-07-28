<?php

namespace App\Services;

use App\Enums\GigDiscoveryChange;
use App\Enums\GigRealtimeChange;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Events\GigDiscoveryChanged;
use App\Events\GigStateChanged;
use App\Models\Gig;
use App\Models\User;

class GigRealtimeService
{
    /**
     * @param  array<int, int>  $recipientIds
     */
    public function stateChanged(int|Gig $gig, GigRealtimeChange $change, array $recipientIds = []): void
    {
        $gig = $this->gig($gig);
        $recipientIds = collect($recipientIds)->push($gig->client_id);
        $acceptedFreelancerId = $gig->acceptedOffer()->value('freelancer_id');

        if ($acceptedFreelancerId !== null) {
            $recipientIds->push($acceptedFreelancerId);
        }

        if ($change === GigRealtimeChange::Dispute) {
            $recipientIds = $recipientIds->merge(
                User::query()
                    ->where('role', UserRole::Admin)
                    ->pluck('id'),
            );
        }

        GigStateChanged::dispatch(
            $gig->id,
            $change,
            $gig->status,
            $recipientIds->unique()->map(fn ($id): int => (int) $id)->values()->all(),
            now()->toISOString(),
        );
    }

    public function discoveryChanged(int|Gig $gig, GigDiscoveryChange $change): void
    {
        $gig = $this->gig($gig);
        $discoverable = $gig->status === GigStatus::Open
            && Gig::query()->whereKey($gig)->futureScheduled()->exists();
        $pendingApplicantsCount = $change === GigDiscoveryChange::ApplicantCount
            ? $gig->offers()->pending()->count()
            : null;

        GigDiscoveryChanged::dispatch(
            $gig->id,
            $change,
            $discoverable,
            $pendingApplicantsCount,
            now()->toISOString(),
        );
    }

    private function gig(int|Gig $gig): Gig
    {
        return $gig instanceof Gig
            ? $gig->fresh() ?? $gig
            : Gig::query()->findOrFail($gig);
    }
}
