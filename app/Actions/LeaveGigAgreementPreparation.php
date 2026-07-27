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

final class LeaveGigAgreementPreparation
{
    public function __construct(private NotificationService $notificationService) {}

    public function execute(User $freelancer, Gig $gig): GigAgreement
    {
        $persistedAgreement = GigAgreement::query()->forGig($gig)->open()->latest('id')->first(['id', 'gig_offer_id']);
        if ($persistedAgreement === null) {
            throw new DomainException('No active agreement exists for this gig.');
        }
        $freelancerId = GigOffer::query()->whereKey($persistedAgreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        [$agreement, $clientId] = DB::transaction(function () use ($persistedAgreement, $freelancerId, $freelancer, $gig): array {
            $lockedFreelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
            $agreement = GigAgreement::query()->lockForUpdate()->findOrFail($persistedAgreement->id);
            $offer = GigOffer::query()->whereKey([$persistedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->firstOrFail();

            if ($lockedFreelancer->role !== UserRole::Freelancer || $lockedFreelancer->id !== $freelancer->id) {
                throw new AuthorizationException('Freelancer does not own this agreement.');
            }

            if ($lockedGig->status !== GigStatus::AgreementPreparation || $offer->status !== GigOfferStatus::ACCEPTED) {
                throw new DomainException('Agreement preparation cannot be left in the current state.');
            }

            if ($agreement->gig_id !== $lockedGig->id || $agreement->gig_offer_id !== $offer->id) {
                throw new DomainException('Agreement associations changed during processing.');
            }

            $offer->status = GigOfferStatus::WITHDRAWN;
            $offer->save();
            $agreement->closed_at = now();
            $agreement->closure_reason = GigAgreementClosureReason::FreelancerLeft;
            $agreement->save();
            $lockedGig->status = GigStatus::Open;
            $lockedGig->save();

            return [$agreement->refresh(), $lockedGig->client_id];
        }, attempts: 3);

        $this->notify($freelancer->id, $clientId, $gig->id);

        return $agreement;
    }

    private function notify(int $freelancerId, int $clientId, int $gigId): void
    {
        try {
            $this->notificationService->send(
                title: 'Freelancer Meninggalkan Persiapan',
                targetType: NotificationTargetType::User,
                createdBy: $freelancerId,
                body: 'Freelancer meninggalkan persiapan persetujuan dan gig dibuka kembali.',
                recipientIds: [$clientId],
                action_url: route('app.gigs.show', ['gig' => $gigId]),
                action_label: 'Lihat Detail Gig',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
