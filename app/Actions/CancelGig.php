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

final class CancelGig
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function execute(User $client, Gig $gig): Gig
    {
        $persistedAgreement = GigAgreement::query()->forGig($gig)->open()->latest('id')->first(['id', 'gig_offer_id']);
        $agreementFreelancerId = $persistedAgreement === null
            ? null
            : GigOffer::query()->whereKey($persistedAgreement->gig_offer_id)->value('freelancer_id');

        [$cancelledGig, $freelancerIds, $agreementFreelancerId] = DB::transaction(function () use ($client, $gig, $persistedAgreement, $agreementFreelancerId): array {
            if ($agreementFreelancerId !== null) {
                User::query()->lockForUpdate()->findOrFail($agreementFreelancerId);
            }

            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);

            if ($client->role !== UserRole::Client || $lockedGig->client_id !== $client->id) {
                throw new AuthorizationException('Client does not own this gig.');
            }

            if (! in_array($lockedGig->status, [GigStatus::Open, GigStatus::AgreementPreparation, GigStatus::LockPending], true)) {
                throw new DomainException('Gig cannot be cancelled in its current status.');
            }

            $agreement = ! in_array($lockedGig->status, [GigStatus::AgreementPreparation, GigStatus::LockPending], true)
                ? null
                : ($persistedAgreement === null
                    ? null
                    : GigAgreement::query()->lockForUpdate()->findOrFail($persistedAgreement->id));
            if ($agreement !== null && $agreement->gig_id !== $lockedGig->id) {
                throw new DomainException('Agreement associations changed during processing.');
            }

            $affectedOfferIds = GigOffer::query()
                ->forGig($lockedGig->id)
                ->whereIn('status', [GigOfferStatus::PENDING, GigOfferStatus::ACCEPTED])
                ->pluck('id');
            $lockedOffers = GigOffer::query()
                ->whereKey($affectedOfferIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $freelancerIds = $lockedOffers->pluck('freelancer_id')->unique()->values()->all();

            foreach ($lockedOffers as $lockedOffer) {
                if ($lockedOffer->status === GigOfferStatus::PENDING) {
                    $lockedOffer->status = GigOfferStatus::REJECTED;
                    $lockedOffer->save();
                }
            }

            if ($agreement !== null) {
                $agreement->closed_at = now();
                $agreement->closure_reason = GigAgreementClosureReason::GigCancelled;
                $agreement->save();
            }

            $lockedGig->status = GigStatus::Cancelled;
            $lockedGig->cancelled_at = now();
            $lockedGig->save();

            return [$lockedGig->refresh(), $freelancerIds, $agreementFreelancerId];
        }, attempts: 3);

        foreach ($freelancerIds as $freelancerId) {
            $this->notify($client->id, $freelancerId, $gig->id, $freelancerId === $agreementFreelancerId);
        }

        return $cancelledGig;
    }

    private function notify(int $clientId, int $freelancerId, int $gigId, bool $isSelectedFreelancer): void
    {
        try {
            $this->notificationService->send(
                title: 'Gig dibatalkan',
                targetType: NotificationTargetType::User,
                createdBy: $clientId,
                body: 'Gig yang Anda lamar telah dibatalkan oleh klien.',
                recipientIds: [$freelancerId],
                action_url: $isSelectedFreelancer
                    ? route('app.gigs.agreement.show', ['gig' => $gigId])
                    : route('app.gigs.show', ['gig' => $gigId]),
                action_label: $isSelectedFreelancer ? 'Lihat Persetujuan' : 'Lihat Gig',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
