<?php

namespace App\Actions;

use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class StartGig
{
    public function __construct(private NotificationService $notifications) {}

    public function execute(User $client, Gig $gig): Gig
    {
        $payment = $gig->currentPayment()->firstOrFail(['id', 'gig_agreement_id']);
        $agreement = GigAgreement::query()->findOrFail($payment->gig_agreement_id, ['id', 'gig_offer_id']);
        $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        [$startedGig, $clientId] = DB::transaction(function () use ($client, $gig, $payment, $agreement, $freelancerId): array {
            $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $lockedPayment = GigPayment::query()->lockForUpdate()->findOrFail($payment->id);
            $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->firstOrFail();
            if ($client->role !== UserRole::Client || $lockedGig->client_id !== $client->id) {
                throw new AuthorizationException('Client does not own this gig.');
            }
            if ($lockedGig->status !== GigStatus::Locked || $lockedPayment->status !== GigPaymentStatus::Paid || $lockedAgreement->freelancer_confirmed_at === null || $offer->status !== GigOfferStatus::ACCEPTED || $lockedPayment->gig_id !== $lockedGig->id || $lockedPayment->gig_agreement_id !== $lockedAgreement->id || $lockedAgreement->gig_id !== $lockedGig->id || $offer->freelancer_id !== $freelancer->id || $lockedPayment->amount !== $lockedAgreement->final_total_price) {
                throw new DomainException('Gig cannot be started in the current state.');
            }
            if ($lockedGig->exitRequests()->active()->exists() || $lockedGig->dispute()->exists() || $lockedGig->settlement()->exists()) {
                throw new DomainException('Gig has an active workflow that prevents starting work.');
            }
            $lockedGig->status = GigStatus::InProgress;
            $lockedGig->started_at = now();
            $lockedGig->save();

            return [$lockedGig->refresh(), $lockedGig->client_id];
        }, attempts: 3);
        try {
            $this->notifications->send(
                'Pekerjaan Dimulai',
                NotificationTargetType::User,
                $clientId,
                "{$client->name} telah resmi memulai pekerjaan untuk gig \"{$gig->title}\". Silakan periksa halaman workflow untuk melihat instruksi dan memulai pengerjaan.",
                [$freelancerId],
                action_url: route('app.gigs.workflow.show', $gig),
                action_label: 'Lihat Workflow'
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $startedGig;
    }
}
