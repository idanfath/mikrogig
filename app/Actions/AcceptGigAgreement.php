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
use Illuminate\Support\Str;
use Throwable;

final class AcceptGigAgreement
{
    public function __construct(
        private NotificationService $notificationService,
        private PrepareGigPaymentCheckout $prepareCheckout,
    ) {}

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

        [$agreement, $payment, $clientId] = DB::transaction(function () use ($persistedAgreement, $freelancerId, $freelancer, $gig): array {
            $lockedFreelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
            $agreement = GigAgreement::query()->lockForUpdate()->findOrFail($persistedAgreement->id);
            $offer = GigOffer::query()->whereKey([$persistedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->firstOrFail();

            if ($lockedFreelancer->role !== UserRole::Freelancer || $lockedFreelancer->id !== $freelancer->id) {
                throw new AuthorizationException('Freelancer does not own this agreement.');
            }

            if ($lockedGig->status !== GigStatus::LockPending || $offer->status !== GigOfferStatus::ACCEPTED || $agreement->submitted_at === null) {
                throw new DomainException('Agreement cannot be accepted in the current state.');
            }

            if ($agreement->gig_id !== $lockedGig->id || $agreement->gig_offer_id !== $offer->id) {
                throw new DomainException('Agreement associations changed during processing.');
            }

            if ($agreement->final_total_price === null) {
                throw new DomainException('Agreement final total is required before acceptance.');
            }

            $agreement->freelancer_confirmed_at = now();
            $agreement->save();

            $payment = new GigPayment([
                'amount' => $agreement->final_total_price,
                'currency' => 'IDR',
                'local_reference' => (string) Str::ulid(),
                'provider' => (string) config('payments.default'),
                'expires_at' => now()->addHours((int) config('payments.window_hours', 3)),
            ]);
            $payment->gig()->associate($lockedGig);
            $payment->agreement()->associate($agreement);
            $payment->status = GigPaymentStatus::Pending;
            $payment->save();

            $lockedGig->status = GigStatus::PaymentPending;
            $lockedGig->save();

            return [$agreement->refresh(), $payment->refresh(), $lockedGig->client_id];
        }, attempts: 3);

        try {
            $this->prepareCheckout->execute($payment);
        } catch (Throwable $exception) {
            report($exception);
        }

        $this->notify($freelancer->id, $clientId, $gig->id, 'Freelancer menyetujui syarat', 'Freelancer telah menyetujui syarat final gig. Pembayaran demo siap dilanjutkan.');

        return $agreement;
    }

    private function notify(int $freelancerId, int $clientId, int $gigId, string $title, string $body): void
    {
        try {
            $this->notificationService->send(
                title: $title,
                targetType: NotificationTargetType::User,
                createdBy: $freelancerId,
                body: $body,
                recipientIds: [$clientId],
                action_url: route('app.gigs.payment.show', ['gig' => $gigId]),
                action_label: 'Lihat Pembayaran',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
