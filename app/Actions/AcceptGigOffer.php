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
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class AcceptGigOffer
{
    public function __construct(private NotificationService $notificationService) {}

    public function execute(User $client, GigOffer $offer): GigOffer
    {
        $persistedOffer = GigOffer::query()->findOrFail($offer->id, ['id', 'freelancer_id', 'gig_id']);

        [$acceptedOffer, $winnerId, $autoWithdrawn, $rejectedFreelancerIds] = DB::transaction(
            function () use ($client, $persistedOffer): array {
                $lockedFreelancer = User::query()->lockForUpdate()->findOrFail($persistedOffer->freelancer_id);
                $lockedGig = Gig::query()->lockForUpdate()->findOrFail($persistedOffer->gig_id);

                $affectedOfferIds = GigOffer::query()
                    ->forGig($lockedGig->id)
                    ->pending()
                    ->pluck('id')
                    ->merge(GigOffer::query()
                        ->forFreelancer($lockedFreelancer->id)
                        ->exceptGig($lockedGig->id)
                        ->pending()
                        ->pluck('id'))
                    ->push($persistedOffer->id)
                    ->unique()
                    ->values();

                $lockedOffers = GigOffer::query()
                    ->whereKey($affectedOfferIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');
                $selectedOffer = $lockedOffers->get($persistedOffer->id);

                if ($selectedOffer === null) {
                    throw new DomainException('Selected offer no longer exists.');
                }

                $this->ensureClientMayAccept($client, $lockedGig, $selectedOffer, $persistedOffer);

                $hasOtherActiveAcceptedGig = GigOffer::query()
                    ->forFreelancer($lockedFreelancer->id)
                    ->exceptGig($lockedGig->id)
                    ->activeAccepted()
                    ->exists();

                if ($hasOtherActiveAcceptedGig) {
                    throw new DomainException('Freelancer already has active accepted work.');
                }

                $rejectedFreelancerIds = [];
                $autoWithdrawn = false;

                foreach ($lockedOffers as $lockedOffer) {
                    if ($lockedOffer->id === $selectedOffer->id) {
                        $lockedOffer->status = GigOfferStatus::ACCEPTED;
                    } elseif ($lockedOffer->gig_id === $lockedGig->id && $lockedOffer->status === GigOfferStatus::PENDING) {
                        $lockedOffer->status = GigOfferStatus::REJECTED;
                        $rejectedFreelancerIds[] = $lockedOffer->freelancer_id;
                    } elseif ($lockedOffer->freelancer_id === $lockedFreelancer->id && $lockedOffer->status === GigOfferStatus::PENDING) {
                        $lockedOffer->status = GigOfferStatus::AUTO_WITHDRAWN;
                        $autoWithdrawn = true;
                    }

                    $lockedOffer->save();
                }

                $lockedGig->status = GigStatus::AgreementPreparation;
                $lockedGig->save();

                return [
                    $selectedOffer->refresh(),
                    $lockedFreelancer->id,
                    $autoWithdrawn,
                    array_values(array_unique($rejectedFreelancerIds)),
                ];
            },
            attempts: 3,
        );

        $winnerBody = 'Penawaran Anda diterima oleh klien.';
        if ($autoWithdrawn) {
            $winnerBody .= ' Aplikasi tertunda lainnya ditarik otomatis karena Anda sekarang berkomitmen pada gig ini.';
        }

        $this->notify($client->id, $winnerId, 'Penawaran diterima', $winnerBody);

        foreach ($rejectedFreelancerIds as $freelancerId) {
            $this->notify($client->id, $freelancerId, 'Penawaran ditolak', 'Penawaran Anda ditolak karena klien memilih freelancer lain.');
        }

        return $acceptedOffer;
    }

    private function ensureClientMayAccept(User $client, Gig $gig, GigOffer $offer, GigOffer $persistedOffer): void
    {
        if ($client->role !== UserRole::Client || $gig->client_id !== $client->id) {
            throw new AuthorizationException('Client does not own this gig.');
        }

        if ($gig->status !== GigStatus::Open) {
            throw new DomainException('Offers may only be accepted while a gig is open.');
        }

        if ($offer->gig_id !== $persistedOffer->gig_id || $offer->freelancer_id !== $persistedOffer->freelancer_id) {
            throw new DomainException('Offer associations changed during processing.');
        }

        if ($offer->status !== GigOfferStatus::PENDING) {
            throw new DomainException('Only pending offers may be accepted.');
        }
    }

    private function notify(int $clientId, int $freelancerId, string $title, string $body): void
    {
        try {
            $this->notificationService->send(
                title: $title,
                targetType: NotificationTargetType::User,
                createdBy: $clientId,
                body: $body,
                recipientIds: [$freelancerId],
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
