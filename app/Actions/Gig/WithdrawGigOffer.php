<?php

namespace App\Actions\Gig;

use App\Enums\GigDiscoveryChange;
use App\Enums\GigOfferStatus;
use App\Enums\GigRealtimeChange;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\GigRealtimeService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

final class WithdrawGigOffer
{
    public function __construct(private GigRealtimeService $realtime) {}

    public function execute(User $freelancer, GigOffer $offer): GigOffer
    {
        $persistedOffer = GigOffer::query()->findOrFail($offer->id, ['id', 'freelancer_id', 'gig_id']);

        $withdrawnOffer = DB::transaction(function () use ($freelancer, $persistedOffer): GigOffer {
            User::query()->lockForUpdate()->findOrFail($persistedOffer->freelancer_id);
            $lockedOffer = GigOffer::query()
                ->whereKey([$persistedOffer->id])
                ->orderBy('id')
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOffer->freelancer_id !== $freelancer->id) {
                throw new AuthorizationException('Freelancer does not own this offer.');
            }

            if ($lockedOffer->status !== GigOfferStatus::PENDING) {
                throw new DomainException('Only pending offers may be withdrawn.');
            }

            $lockedOffer->status = GigOfferStatus::WITHDRAWN;
            $lockedOffer->save();

            return $lockedOffer->refresh();
        }, attempts: 3);

        $this->realtime->stateChanged($persistedOffer->gig_id, GigRealtimeChange::Offer, [$freelancer->id]);
        $this->realtime->discoveryChanged($persistedOffer->gig_id, GigDiscoveryChange::ApplicantCount);

        return $withdrawnOffer;
    }
}
