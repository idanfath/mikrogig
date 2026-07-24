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

final class CancelGig
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function execute(User $client, Gig $gig): Gig
    {
        [$cancelledGig, $freelancerIds] = DB::transaction(function () use ($client, $gig): array {
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);

            if ($client->role !== UserRole::Client || $lockedGig->client_id !== $client->id) {
                throw new AuthorizationException('Client does not own this gig.');
            }

            if (!in_array($lockedGig->status, [GigStatus::Open, GigStatus::AgreementPreparation], true)) {
                throw new DomainException('Gig cannot be cancelled in its current status.');
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

            $lockedGig->status = GigStatus::Cancelled;
            $lockedGig->cancelled_at = now();
            $lockedGig->save();

            return [$lockedGig->refresh(), $freelancerIds];
        }, attempts: 3);

        foreach ($freelancerIds as $freelancerId) {
            $this->notify($client->id, $freelancerId);
        }

        return $cancelledGig;
    }

    private function notify(int $clientId, int $freelancerId): void
    {
        try {
            $this->notificationService->send(
                title: 'Gig dibatalkan',
                targetType: NotificationTargetType::User,
                createdBy: $clientId,
                body: 'Gig yang Anda lamar telah dibatalkan oleh klien.',
                recipientIds: [$freelancerId],
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
