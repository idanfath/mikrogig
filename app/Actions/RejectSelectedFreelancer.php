<?php

namespace App\Actions;

use App\Enums\GigAgreementClosureReason;
use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class RejectSelectedFreelancer
{
    public function __construct(private NotificationService $notificationService) {}

    public function execute(User $client, Gig $gig): GigAgreement
    {
        $persistedAgreement = GigAgreement::query()->forGig($gig)->open()->latest('id')->first(['id', 'gig_offer_id']);
        if ($persistedAgreement === null) {
            throw new DomainException('No active agreement exists for this gig.');
        }
        $freelancerId = GigOffer::query()->whereKey($persistedAgreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        [$agreement, $freelancerId] = DB::transaction(function () use ($persistedAgreement, $freelancerId, $client, $gig): array {
            $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
            $agreement = GigAgreement::query()->lockForUpdate()->findOrFail($persistedAgreement->id);
            $offer = GigOffer::query()->whereKey([$persistedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->firstOrFail();

            if ($client->role !== UserRole::Client || $lockedGig->client_id !== $client->id) {
                throw new AuthorizationException('Client does not own this gig.');
            }

            if (! in_array($lockedGig->status, [GigStatus::AgreementPreparation, GigStatus::LockPending], true) || $offer->status !== GigOfferStatus::ACCEPTED) {
                throw new DomainException('Selected freelancer cannot be rejected in the current state.');
            }

            if ($agreement->gig_id !== $lockedGig->id || $agreement->gig_offer_id !== $offer->id) {
                throw new DomainException('Agreement associations changed during processing.');
            }

            $offer->status = GigOfferStatus::REJECTED;
            $offer->save();
            $agreement->closed_at = now();
            $agreement->closure_reason = GigAgreementClosureReason::ClientRejected;
            $agreement->save();
            $lockedGig->status = GigStatus::Open;
            $lockedGig->save();

            return [$agreement->refresh(), $freelancer->id];
        }, attempts: 3);

        $this->notify($client->id, $freelancerId, $gig->id);

        return $agreement;
    }

    private function notify(int $clientId, int $freelancerId, int $gigId): void
    {
        try {
            $this->notificationService->send(
                title: 'Pilihan freelancer dibatalkan',
                targetType: NotificationTargetType::User,
                createdBy: $clientId,
                body: 'Klien membatalkan pilihan Anda dan gig dibuka kembali.',
                recipientIds: [$freelancerId],
                action_url: route('app.gigs.agreement.show', ['gig' => $gigId]),
                action_label: 'Lihat Persetujuan',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
