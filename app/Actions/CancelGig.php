<?php

namespace App\Actions;

use App\Enums\GigAgreementClosureReason;
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
use App\Services\Payments\PaymentGateway;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class CancelGig
{
    public function __construct(
        private NotificationService $notificationService,
        private PaymentGateway $paymentGateway,
    ) {}

    public function execute(User $client, Gig $gig): Gig
    {
        $persistedAgreement = GigAgreement::query()->forGig($gig)->open()->latest('id')->first(['id', 'gig_offer_id']);
        $agreementFreelancerId = $persistedAgreement === null
            ? null
            : GigOffer::query()->whereKey($persistedAgreement->gig_offer_id)->value('freelancer_id');
        $persistedPayment = $persistedAgreement === null
            ? null
            : GigPayment::query()->where('gig_agreement_id', $persistedAgreement->id)->first(['id']);

        [$cancelledGig, $freelancerIds, $agreementFreelancerId, $cancelledPayment] = DB::transaction(function () use ($client, $gig, $persistedAgreement, $agreementFreelancerId, $persistedPayment): array {
            if ($agreementFreelancerId !== null) {
                User::query()->lockForUpdate()->findOrFail($agreementFreelancerId);
            }

            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);

            if ($client->role !== UserRole::Client || $lockedGig->client_id !== $client->id) {
                throw new AuthorizationException('Client does not own this gig.');
            }

            if (! in_array($lockedGig->status, [GigStatus::Open, GigStatus::AgreementPreparation, GigStatus::LockPending, GigStatus::PaymentPending], true)) {
                throw new DomainException('Gig cannot be cancelled in its current status.');
            }

            $agreement = ! in_array($lockedGig->status, [GigStatus::AgreementPreparation, GigStatus::LockPending, GigStatus::PaymentPending], true)
                ? null
                : ($persistedAgreement === null
                    ? null
                    : GigAgreement::query()->lockForUpdate()->findOrFail($persistedAgreement->id));
            if ($agreement !== null && $agreement->gig_id !== $lockedGig->id) {
                throw new DomainException('Agreement associations changed during processing.');
            }

            $payment = $lockedGig->status !== GigStatus::PaymentPending
                ? null
                : ($persistedPayment === null
                    ? throw new DomainException('Pending gig payment no longer exists.')
                    : GigPayment::query()->lockForUpdate()->findOrFail($persistedPayment->id));
            if ($payment !== null
                && ($payment->gig_id !== $lockedGig->id
                    || $agreement === null
                    || $payment->gig_agreement_id !== $agreement->id
                    || $payment->status !== GigPaymentStatus::Pending)) {
                throw new DomainException('Payment cannot be cancelled in the current state.');
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

            if ($agreement !== null) {
                $agreement->closed_at = now();
                $agreement->closure_reason = GigAgreementClosureReason::GigCancelled;
                $agreement->save();
            }

            if ($payment !== null) {
                $payment->status = GigPaymentStatus::Cancelled;
                $payment->cancelled_at = now();
                $payment->save();
            }

            $lockedGig->status = GigStatus::Cancelled;
            $lockedGig->cancelled_at = now();
            $lockedGig->save();

            return [$lockedGig->refresh(), $freelancerIds, $agreementFreelancerId, $payment?->refresh()];
        }, attempts: 3);

        if ($cancelledPayment !== null) {
            try {
                $this->paymentGateway->cancelCheckout($cancelledPayment);
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        foreach ($freelancerIds as $freelancerId) {
            $this->notify(
                $client->id,
                $freelancerId,
                $gig->id,
                $freelancerId === $agreementFreelancerId,
                $cancelledPayment !== null,
            );
        }

        return $cancelledGig;
    }

    private function notify(
        int $clientId,
        int $freelancerId,
        int $gigId,
        bool $isSelectedFreelancer,
        bool $hasPayment,
    ): void {
        try {
            $this->notificationService->send(
                title: 'Gig dibatalkan',
                targetType: NotificationTargetType::User,
                createdBy: $clientId,
                body: 'Gig yang Anda lamar telah dibatalkan oleh klien.',
                recipientIds: [$freelancerId],
                action_url: $isSelectedFreelancer
                    ? ($hasPayment
                        ? route('app.gigs.payment.show', ['gig' => $gigId])
                        : route('app.gigs.agreement.show', ['gig' => $gigId]))
                    : route('app.gigs.show', ['gig' => $gigId]),
                action_label: $isSelectedFreelancer
                    ? ($hasPayment ? 'Lihat Pembayaran' : 'Lihat Persetujuan')
                    : 'Lihat Gig',
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
