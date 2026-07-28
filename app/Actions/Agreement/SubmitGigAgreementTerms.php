<?php

namespace App\Actions\Agreement;

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
use Carbon\CarbonImmutable;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class SubmitGigAgreementTerms
{
    public function __construct(
        private NotificationService $notificationService,
        private GigRealtimeService $realtime,
    ) {}

    /** @param array{final_scope:string,work_date:string,start_time:string,location_arrangement:string,delivery_expectations:string,final_total_price:int} $attributes */
    public function execute(User $client, Gig $gig, array $attributes): GigAgreement
    {
        $persistedAgreement = GigAgreement::query()->forGig($gig)->open()->latest('id')->first(['id', 'gig_offer_id']);
        if ($persistedAgreement === null) {
            throw new DomainException('No active agreement exists for this gig.');
        }
        $freelancerId = GigOffer::query()->whereKey($persistedAgreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        [$agreement, $freelancerId] = DB::transaction(function () use ($persistedAgreement, $freelancerId, $client, $gig, $attributes): array {
            $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
            $agreement = GigAgreement::query()->lockForUpdate()->findOrFail($persistedAgreement->id);
            $offer = GigOffer::query()->whereKey([$persistedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->firstOrFail();

            if ($client->role !== UserRole::Client || $lockedGig->client_id !== $client->id) {
                throw new AuthorizationException('Client does not own this gig.');
            }

            if ($lockedGig->status !== GigStatus::AgreementPreparation || $offer->status !== GigOfferStatus::ACCEPTED) {
                throw new DomainException('Agreement terms cannot be submitted in the current state.');
            }

            if ($agreement->gig_id !== $lockedGig->id || $agreement->gig_offer_id !== $offer->id || $freelancer->id !== $offer->freelancer_id) {
                throw new DomainException('Agreement associations changed during processing.');
            }

            $schedule = CarbonImmutable::parse("{$attributes['work_date']} {$attributes['start_time']}", config('app.timezone'));
            if (! $schedule->isFuture() || $attributes['final_total_price'] < 1_000) {
                throw new DomainException('Agreement requires a future schedule and valid final total.');
            }

            $agreement->fill($attributes);
            $agreement->terms_version++;
            $agreement->submitted_at = now();
            $agreement->freelancer_confirmed_at = null;
            $agreement->save();

            $lockedGig->status = GigStatus::LockPending;
            $lockedGig->save();

            return [$agreement->refresh(), $freelancer->id];
        }, attempts: 3);

        $this->realtime->stateChanged($gig, GigRealtimeChange::Agreement, [$client->id, $freelancerId]);
        $this->notify($client->id, $freelancerId, $gig->id, 'Syarat gig siap dikonfirmasi', 'Klien telah mengirimkan syarat final untuk persetujuan Anda.');

        return $agreement;
    }

    private function notify(int $clientId, int $freelancerId, int $gigId, string $title, string $body): void
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
