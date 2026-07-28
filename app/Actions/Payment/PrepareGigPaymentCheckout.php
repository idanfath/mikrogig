<?php

namespace App\Actions\Payment;

use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigRealtimeChange;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigRealtimeService;
use App\Services\Payments\PaymentGateway;
use DomainException;
use Illuminate\Support\Facades\DB;

final class PrepareGigPaymentCheckout
{
    public function __construct(
        private PaymentGateway $paymentGateway,
        private GigRealtimeService $realtime,
    ) {}

    public function execute(GigPayment $payment): GigPayment
    {
        $persisted = GigPayment::query()->findOrFail($payment->id);
        if ($persisted->checkout_url !== null) {
            if ($persisted->status !== GigPaymentStatus::Pending
                || $persisted->expires_at->isPast()
                || $persisted->gig()->value('status') !== GigStatus::PaymentPending->value) {
                throw new DomainException('Payment checkout cannot be prepared in the current state.');
            }

            return $persisted;
        }

        if ($persisted->provider !== config('payments.default')) {
            throw new DomainException('Payment provider is not available.');
        }

        $agreement = GigAgreement::query()->findOrFail($persisted->gig_agreement_id, ['id', 'gig_id', 'gig_offer_id']);
        $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        $checkout = $this->paymentGateway->createCheckout($persisted);

        [$preparedPayment, $changed] = DB::transaction(function () use ($persisted, $agreement, $freelancerId, $checkout): array {
            User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($agreement->gig_id);
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $lockedPayment = GigPayment::query()->lockForUpdate()->findOrFail($persisted->id);
            $offer = GigOffer::query()
                ->whereKey([$lockedAgreement->gig_offer_id])
                ->orderBy('id')
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPayment->gig_id !== $lockedGig->id
                || $lockedPayment->gig_agreement_id !== $lockedAgreement->id
                || $lockedAgreement->gig_id !== $lockedGig->id
                || $lockedAgreement->gig_offer_id !== $offer->id) {
                throw new DomainException('Payment associations changed during processing.');
            }

            if ($lockedPayment->checkout_url !== null) {
                return [$lockedPayment, false];
            }

            if ($lockedGig->status !== GigStatus::PaymentPending
                || $lockedPayment->status !== GigPaymentStatus::Pending
                || $offer->status !== GigOfferStatus::ACCEPTED
                || $lockedAgreement->closed_at !== null
                || $lockedPayment->expires_at->isPast()) {
                throw new DomainException('Payment checkout cannot be prepared in the current state.');
            }

            $lockedPayment->provider_reference = $checkout->providerReference;
            $lockedPayment->checkout_url = $checkout->checkoutUrl;
            $lockedPayment->checkout_prepared_at = now();
            $lockedPayment->save();

            return [$lockedPayment->refresh(), true];
        }, attempts: 3);

        if ($changed) {
            $this->realtime->stateChanged($preparedPayment->gig_id, GigRealtimeChange::Payment, [$freelancerId]);
        }

        return $preparedPayment;
    }
}
