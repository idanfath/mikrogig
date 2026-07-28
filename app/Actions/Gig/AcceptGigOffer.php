<?php

namespace App\Actions\Gig;

use App\Enums\GigDiscoveryChange;
use App\Enums\GigOfferStatus;
use App\Enums\GigRealtimeChange;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\GigRealtimeService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class AcceptGigOffer
{
    public function __construct(
        private NotificationService $notificationService,
        private GigRealtimeService $realtime,
    ) {}

    public function execute(User $client, GigOffer $offer): GigOffer
    {
        $persistedOffer = GigOffer::query()->findOrFail($offer->id, ['id', 'freelancer_id', 'gig_id']);

        [$acceptedOffer, $winnerId, $winnerAutoWithdrawn, $sameGigAutoWithdrawnFreelancerIds, $otherGigIds] = DB::transaction(
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

                $sameGigAutoWithdrawnFreelancerIds = [];
                $winnerAutoWithdrawn = false;

                foreach ($lockedOffers as $lockedOffer) {
                    if ($lockedOffer->id === $selectedOffer->id) {
                        $lockedOffer->status = GigOfferStatus::ACCEPTED;
                    } elseif ($lockedOffer->gig_id === $lockedGig->id && $lockedOffer->status === GigOfferStatus::PENDING) {
                        $lockedOffer->status = GigOfferStatus::AUTO_WITHDRAWN;
                        $sameGigAutoWithdrawnFreelancerIds[] = $lockedOffer->freelancer_id;
                    } elseif ($lockedOffer->freelancer_id === $lockedFreelancer->id && $lockedOffer->status === GigOfferStatus::PENDING) {
                        $lockedOffer->status = GigOfferStatus::AUTO_WITHDRAWN;
                        $winnerAutoWithdrawn = true;
                    }

                    $lockedOffer->save();
                }

                $lockedGig->status = GigStatus::AgreementPreparation;
                $lockedGig->save();

                $agreement = new GigAgreement([
                    'gig_id' => $lockedGig->id,
                    'gig_offer_id' => $selectedOffer->id,
                    'accepted_fee' => $selectedOffer->offered_fee,
                    'final_scope' => $lockedGig->description,
                    'work_date' => $lockedGig->work_date,
                    'start_time' => $lockedGig->start_time,
                    'location_arrangement' => $lockedGig->location_address,
                    'final_total_price' => $selectedOffer->offered_fee,
                ]);
                $agreement->gig()->associate($lockedGig);
                $agreement->acceptedOffer()->associate($selectedOffer);
                $agreement->save();

                return [
                    $selectedOffer->refresh(),
                    $lockedFreelancer->id,
                    $winnerAutoWithdrawn,
                    array_values(array_unique($sameGigAutoWithdrawnFreelancerIds)),
                    $lockedOffers
                        ->where('freelancer_id', $lockedFreelancer->id)
                        ->where('gig_id', '!=', $lockedGig->id)
                        ->pluck('gig_id')
                        ->unique()
                        ->values()
                        ->all(),
                ];
            },
            attempts: 3,
        );

        $winnerBody = 'Penawaran Anda diterima oleh klien.';
        if ($winnerAutoWithdrawn) {
            $winnerBody .= ' Aplikasi tertunda lainnya ditarik otomatis karena Anda sekarang berkomitmen pada gig ini.';
        }

        $gigId = $persistedOffer->gig_id;

        $this->realtime->stateChanged(
            $gigId,
            GigRealtimeChange::Offer,
            [$client->id, $winnerId, ...$sameGigAutoWithdrawnFreelancerIds],
        );
        $this->realtime->discoveryChanged($gigId, GigDiscoveryChange::Remove);
        foreach ($otherGigIds as $otherGigId) {
            $this->realtime->stateChanged($otherGigId, GigRealtimeChange::Offer, [$winnerId]);
            $this->realtime->discoveryChanged($otherGigId, GigDiscoveryChange::ApplicantCount);
        }

        $this->notify($client->id, $winnerId, 'Penawaran diterima', $winnerBody, $gigId);

        foreach ($sameGigAutoWithdrawnFreelancerIds as $freelancerId) {
            $this->notify(
                $client->id,
                $freelancerId,
                'Penawaran Ditarik Otomatis',
                'Penawaran Anda ditarik otomatis karena klien memilih freelancer lain. Anda dapat melamar kembali jika gig ini kembali terbuka.',
                $gigId,
            );
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

    private function notify(int $clientId, int $freelancerId, string $title, string $body, int $gigId): void
    {
        try {
            $this->notificationService->send(
                title: $title,
                targetType: NotificationTargetType::User,
                createdBy: $clientId,
                body: $body,
                recipientIds: [$freelancerId],
                action_url: route('app.gigs.agreement.show', ['gig' => $gigId]),
                action_label: 'Lihat Persetujuan',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
