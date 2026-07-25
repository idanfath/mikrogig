<?php

namespace App\Actions;

use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\CarbonInterface;
use DomainException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class MarkGigPaymentPaid
{
    public function __construct(private NotificationService $notificationService) {}

    public function execute(
        GigPayment $payment,
        string $localReference,
        int $amount,
        CarbonInterface $providerPaidAt,
    ): GigPayment {
        $persisted = GigPayment::query()->findOrFail($payment->id, ['id', 'gig_id', 'gig_agreement_id']);
        $agreement = GigAgreement::query()->findOrFail($persisted->gig_agreement_id, ['id', 'gig_id', 'gig_offer_id']);
        $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        [$paidPayment, $clientId, $wasAlreadyPaid] = DB::transaction(function () use ($persisted, $agreement, $freelancerId, $localReference, $amount, $providerPaidAt): array {
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
                || $lockedAgreement->gig_offer_id !== $offer->id
                || $lockedPayment->amount !== $lockedAgreement->final_total_price) {
                throw new DomainException('Payment associations changed during processing.');
            }

            $confirmationMatches = $lockedPayment->local_reference === $localReference
                && $lockedPayment->amount === $amount;
            if ($lockedPayment->status === GigPaymentStatus::Paid) {
                if (! $confirmationMatches || $lockedGig->status !== GigStatus::Locked) {
                    throw new DomainException('Payment confirmation conflicts with persisted state.');
                }

                return [$lockedPayment, $lockedGig->client_id, true];
            }

            if (! $confirmationMatches) {
                throw new DomainException('Payment confirmation does not match the expected reference or amount.');
            }

            if ($lockedPayment->status !== GigPaymentStatus::Pending
                || $lockedGig->status !== GigStatus::PaymentPending
                || $offer->status !== GigOfferStatus::ACCEPTED
                || $lockedAgreement->closed_at !== null
                || $lockedPayment->expires_at->isPast()) {
                throw new DomainException('Payment cannot be confirmed in the current state.');
            }

            $lockedPayment->status = GigPaymentStatus::Paid;
            $lockedPayment->provider_paid_at = $providerPaidAt;
            $lockedPayment->paid_at = now();
            $lockedPayment->save();

            $lockedGig->status = GigStatus::Locked;
            $lockedGig->save();

            return [$lockedPayment->refresh(), $lockedGig->client_id, false];
        }, attempts: 3);

        if (! $wasAlreadyPaid) {
            $this->notify($clientId, $freelancerId, $paidPayment->gig_id);
        }

        return $paidPayment;
    }

    private function notify(int $clientId, int $freelancerId, int $gigId): void
    {
        try {
            $this->notificationService->send(
                title: 'Pembayaran dikonfirmasi',
                targetType: NotificationTargetType::User,
                createdBy: $clientId,
                body: 'Pembayaran demo telah dikonfirmasi dan gig kini terkunci.',
                recipientIds: [$freelancerId],
                action_url: route('app.gigs.payment.show', ['gig' => $gigId]),
                action_label: 'Lihat Pembayaran',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
