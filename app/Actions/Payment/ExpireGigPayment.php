<?php

namespace App\Actions\Payment;

use App\Enums\GigAgreementClosureReason;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigRealtimeChange;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigRealtimeService;
use App\Services\NotificationService;
use App\Services\Payments\PaymentGateway;
use DomainException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class ExpireGigPayment
{
    public function __construct(
        private PaymentGateway $paymentGateway,
        private NotificationService $notificationService,
        private GigRealtimeService $realtime,
    ) {}

    public function execute(GigPayment $payment): GigPayment
    {
        $persisted = GigPayment::query()->findOrFail($payment->id, ['id', 'gig_id', 'gig_agreement_id']);
        $agreement = GigAgreement::query()->findOrFail($persisted->gig_agreement_id, ['id', 'gig_id', 'gig_offer_id']);
        $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        [$expiredPayment, $clientId] = DB::transaction(function () use ($persisted, $agreement, $freelancerId): array {
            User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($persisted->gig_id);
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

            if ($lockedPayment->status !== GigPaymentStatus::Pending
                || $lockedGig->status !== GigStatus::PaymentPending
                || $offer->status !== GigOfferStatus::ACCEPTED
                || $lockedAgreement->closed_at !== null
                || $lockedPayment->expires_at->isFuture()) {
                throw new DomainException('Payment cannot be expired in the current state.');
            }

            $lockedPayment->status = GigPaymentStatus::Expired;
            $lockedPayment->expired_at = now();
            $lockedPayment->save();

            $lockedAgreement->closed_at = now();
            $lockedAgreement->closure_reason = GigAgreementClosureReason::GigCancelled;
            $lockedAgreement->save();

            $lockedGig->status = GigStatus::Cancelled;
            $lockedGig->cancelled_at = now();
            $lockedGig->save();

            return [$lockedPayment->refresh(), $lockedGig->client_id];
        }, attempts: 3);

        try {
            $this->paymentGateway->cancelCheckout($expiredPayment);
        } catch (Throwable $exception) {
            report($exception);
        }

        $this->realtime->stateChanged($expiredPayment->gig_id, GigRealtimeChange::Payment, [$clientId, $freelancerId]);
        $this->notify($clientId, $clientId, $expiredPayment);
        $this->notify($clientId, $freelancerId, $expiredPayment);

        return $expiredPayment;
    }

    private function notify(int $clientId, int $recipientId, GigPayment $payment): void
    {
        $amountFormatted = number_format($payment->amount, 0, ',', '.');

        try {
            $this->notificationService->send(
                title: 'Batas Waktu Pembayaran Berakhir',
                targetType: NotificationTargetType::User,
                createdBy: $clientId,
                body: "Batas waktu pembayaran escrow Rp {$amountFormatted} untuk gig \"{$payment->gig->title}\" telah berakhir. Gig otomatis dibatalkan.",
                recipientIds: [$recipientId],
                action_url: route('app.gigs.payment.show', ['gig' => $payment->gig_id]),
                action_label: 'Lihat Pembayaran',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
