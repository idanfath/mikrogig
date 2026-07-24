<?php

namespace App\Actions;

use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use DomainException;
use Throwable;

final class ApplyToGig
{
    public function __construct(
        private NotificationService $notificationService
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

            $hasActiveAcceptedGig = GigOffer::query()
                ->forFreelancer($lockedFreelancer->id)
                ->activeAccepted()
                ->exists();

            if ($hasActiveAcceptedGig) {
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

            if ($existingOffer !== null && $existingOffer->status !== GigOfferStatus::WITHDRAWN) {
                throw new DomainException('Existing offer cannot be reused.');
            }

            if (GigOffer::query()
                    ->forFreelancer($lockedFreelancer->id)
                    ->pending()
                    ->count() >= 3) {
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

        $this->notify($freelancer->id, $clientId);

        return $offer;
    }

    private function notify(int $freelancerId, int $clientId): void
    {
        try {
            $this->notificationService->send(
                title: 'Pelamar baru',
                targetType: NotificationTargetType::User,
                createdBy: $freelancerId,
                body: 'Seorang freelancer telah melamar gig Anda.',
                recipientIds: [$clientId],
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
