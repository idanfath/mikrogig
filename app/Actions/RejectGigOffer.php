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

final class RejectGigOffer
{
    public function __construct(private NotificationService $notificationService) {}

    public function execute(User $client, GigOffer $offer): GigOffer
    {
        $persistedOffer = GigOffer::query()->findOrFail($offer->id, ['id', 'freelancer_id', 'gig_id']);

        [$rejectedOffer, $freelancerId] = DB::transaction(function () use ($client, $persistedOffer): array {
            User::query()->lockForUpdate()->findOrFail($persistedOffer->freelancer_id);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($persistedOffer->gig_id);
            $lockedOffer = GigOffer::query()
                ->whereKey([$persistedOffer->id])
                ->orderBy('id')
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureClientMayManage($client, $lockedGig, $lockedOffer, $persistedOffer);

            $lockedOffer->status = GigOfferStatus::REJECTED;
            $lockedOffer->save();

            return [$lockedOffer->refresh(), $lockedOffer->freelancer_id];
        }, attempts: 3);

        $this->notify($client->id, $freelancerId, 'Penawaran ditolak', 'Penawaran Anda ditolak oleh klien.');

        return $rejectedOffer;
    }

    private function ensureClientMayManage(User $client, Gig $gig, GigOffer $offer, GigOffer $persistedOffer): void
    {
        if ($client->role !== UserRole::Client || $gig->client_id !== $client->id) {
            throw new AuthorizationException('Client does not own this gig.');
        }

        if ($gig->status !== GigStatus::Open) {
            throw new DomainException('Offers may only be rejected while a gig is open.');
        }

        if ($offer->gig_id !== $persistedOffer->gig_id || $offer->freelancer_id !== $persistedOffer->freelancer_id) {
            throw new DomainException('Offer associations changed during processing.');
        }

        if ($offer->status !== GigOfferStatus::PENDING) {
            throw new DomainException('Only pending offers may be rejected.');
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
