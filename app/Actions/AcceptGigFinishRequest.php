<?php

namespace App\Actions;

use App\Enums\GigFinishRequestStatus;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigFinishRequest;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigSettlementService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class AcceptGigFinishRequest
{
    public function __construct(
        private GigSettlementService $settlements,
        private NotificationService $notifications,
    ) {}

    public function execute(User $client, GigFinishRequest $finishRequest): GigFinishRequest
    {
        [$accepted, $freelancerId] = DB::transaction(function () use ($client, $finishRequest): array {
            $source = GigFinishRequest::query()->findOrFail($finishRequest->id);
            $payment = GigPayment::query()->findOrFail($source->gig_payment_id, ['id', 'gig_id', 'gig_agreement_id']);
            $agreement = GigAgreement::query()->findOrFail($payment->gig_agreement_id, ['id', 'gig_id', 'gig_offer_id']);
            $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
            if ($freelancerId === null) {
                throw new DomainException('Selected offer no longer exists.');
            }

            $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedClient = User::query()->lockForUpdate()->findOrFail($source->gig()->value('client_id'));
            $gig = Gig::query()->lockForUpdate()->findOrFail($source->gig_id);
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $lockedPayment = GigPayment::query()->lockForUpdate()->findOrFail($payment->id);
            $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
            $locked = GigFinishRequest::query()->lockForUpdate()->findOrFail($source->id);

            if ($client->role !== UserRole::Client || $client->id !== $lockedClient->id) {
                throw new AuthorizationException('Only the owning client may accept completion.');
            }
            if ($locked->status !== GigFinishRequestStatus::Pending
                || $gig->status !== GigStatus::Review
                || ! $locked->review_due_at->isFuture()
                || $locked->gig_id !== $gig->id
                || $locked->gig_payment_id !== $lockedPayment->id
                || $locked->freelancer_id !== $freelancer->id
                || $lockedPayment->status !== GigPaymentStatus::Paid
                || $lockedAgreement->gig_id !== $gig->id
                || $lockedPayment->gig_id !== $gig->id
                || $lockedPayment->gig_agreement_id !== $lockedAgreement->id
                || $lockedPayment->amount !== $lockedAgreement->final_total_price
                || $offer->status !== GigOfferStatus::ACCEPTED
                || $offer->freelancer_id !== $freelancer->id
                || $gig->dispute()->exists()
                || $gig->settlement()->exists()) {
                throw new DomainException('Completion cannot be accepted in the current state.');
            }

            $this->settlements->record($gig, $lockedPayment, GigSettlementOutcome::FullFreelancerPayout, finishRequest: $locked);
            $locked->status = GigFinishRequestStatus::Accepted;
            $locked->reviewer()->associate($lockedClient);
            $locked->accepted_at = now();
            $locked->save();
            $gig->status = GigStatus::Completed;
            $gig->completed_at = now();
            $gig->save();

            return [$locked->refresh(), $freelancer->id];
        }, attempts: 3);

        $settlement = $accepted->gig->settlement;
        $amountFormatted = number_format($settlement?->freelancer_payout ?? 0, 0, ',', '.');

        try {
            $this->notifications->send(
                'Pekerjaan Selesai & Dana Dicairkan',
                NotificationTargetType::User,
                $client->id,
                "Hasil pekerjaan gig \"{$accepted->gig->title}\" telah disetujui. Dana sebesar Rp {$amountFormatted} telah dicairkan ke saldo Anda.",
                [$freelancerId],
                action_url: route('app.gigs.workflow.show', $accepted->gig_id),
                action_label: 'Lihat Penyelesaian',
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $accepted;
    }
}
