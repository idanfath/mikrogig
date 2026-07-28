<?php

namespace App\Actions\Gig;

use App\Enums\GigDiscoveryChange;
use App\Enums\GigOfferStatus;
use App\Enums\GigRealtimeChange;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\GigRealtimeService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class ApplyToGig
{
    public function __construct(
        private NotificationService $notificationService,
        private GigRealtimeService $realtime,
    ) {}

    public function execute(
        User $freelancer,
        Gig $gig,
        ?int $offeredFee,
        ?string $note,
    ): GigOffer {
        [$offer, $clientId] = DB::transaction(function () use ($freelancer, $gig, $offeredFee, $note): array {
            $lockedFreelancer = User::query()->lockForUpdate()->findOrFail($freelancer->id);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);

            if ($lockedFreelancer->role !== UserRole::Freelancer) {
                throw new AuthorizationException('Only freelancers may apply to gigs.');
            }

            if ($lockedGig->status !== GigStatus::Open) {
                throw new DomainException('Only open gigs accept offers.');
            }

            if ($lockedGig->client_id === $lockedFreelancer->id) {
                throw new AuthorizationException('Clients may not apply to their own gigs.');
            }

            if ($lockedFreelancer->hasActiveAcceptedWork()) {
                throw new DomainException('Freelancer already has active accepted work.');
            }

            $existingOfferId = GigOffer::query()
                ->forGig($lockedGig->id)
                ->forFreelancer($lockedFreelancer->id)
                ->value('id');

            $existingOffer = $existingOfferId === null
                ? null
                : GigOffer::query()
                    ->whereKey([$existingOfferId])
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->firstOrFail();

            if ($existingOffer !== null && ! in_array($existingOffer->status, [
                GigOfferStatus::WITHDRAWN,
                GigOfferStatus::AUTO_WITHDRAWN,
            ], true)) {
                throw new DomainException('Existing offer cannot be reused.');
            }

            if ($lockedFreelancer->hasReachedPendingOfferLimit()) {
                throw new DomainException('Freelancer may have at most three pending offers.');
            }

            $offer = $existingOffer ?? new GigOffer;
            $offer->gig()->associate($lockedGig);
            $offer->freelancer()->associate($lockedFreelancer);
            $offer->offered_fee = $offeredFee ?? $lockedGig->posted_fee;
            $offer->note = $note;
            $offer->status = GigOfferStatus::PENDING;
            $offer->save();

            return [$offer->refresh(), $lockedGig->client_id];
        }, attempts: 3);

        $this->realtime->stateChanged($gig, GigRealtimeChange::Offer, [$freelancer->id, $clientId]);
        $this->realtime->discoveryChanged($gig, GigDiscoveryChange::ApplicantCount);
        $this->notify($freelancer, $clientId, $gig);

        return $offer;
    }

    private function notify(User $freelancer, int $clientId, Gig $gig): void
    {
        try {
            $this->notificationService->send(
                title: 'Pelamar Baru',
                targetType: NotificationTargetType::User,
                createdBy: $freelancer->id,
                body: "{$freelancer->name} telah melamar untuk mengerjakan gig \"{$gig->title}\".",
                recipientIds: [$clientId],
                action_url: route('app.client.gigs.applicants.index', ['gig' => $gig->id]),
                action_label: 'Lihat Pelamar',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
