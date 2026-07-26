<?php

namespace App\Actions;

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

final class RequestGigAgreementChanges
{
    public function __construct(private NotificationService $notificationService) {}

    public function execute(User $freelancer, Gig $gig, string $note): GigAgreement
    {
        $persistedAgreement = GigAgreement::query()->forGig($gig)->open()->latest('id')->first(['id', 'gig_offer_id']);
        if ($persistedAgreement === null) {
            throw new DomainException('No active agreement exists for this gig.');
        }
        $freelancerId = GigOffer::query()->whereKey($persistedAgreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        [$agreement, $clientId] = DB::transaction(function () use ($persistedAgreement, $freelancerId, $freelancer, $gig, $note): array {
            $lockedFreelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
            $agreement = GigAgreement::query()->lockForUpdate()->findOrFail($persistedAgreement->id);
            $offer = GigOffer::query()->whereKey([$persistedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->firstOrFail();

            if ($lockedFreelancer->role !== UserRole::Freelancer || $lockedFreelancer->id !== $freelancer->id) {
                throw new AuthorizationException('Freelancer does not own this agreement.');
            }

            if ($lockedGig->status !== GigStatus::LockPending || $offer->status !== GigOfferStatus::ACCEPTED || $agreement->submitted_at === null) {
                throw new DomainException('Changes cannot be requested in the current state.');
            }

            if ($agreement->gig_id !== $lockedGig->id || $agreement->gig_offer_id !== $offer->id) {
                throw new DomainException('Agreement associations changed during processing.');
            }

            $agreement->latest_change_request_note = $note;
            $agreement->change_requested_at = now();
            $agreement->save();
            $lockedGig->status = GigStatus::AgreementPreparation;
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
                title: 'Freelancer Meminta Perubahan',
                targetType: NotificationTargetType::User,
                createdBy: $freelancerId,
                body: 'Freelancer meminta perubahan pada syarat gig.',
                recipientIds: [$clientId],
                action_url: route('app.gigs.agreement.show', ['gig' => $gigId]),
                action_label: 'Lihat Persetujuan',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
