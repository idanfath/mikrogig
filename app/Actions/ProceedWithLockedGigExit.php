<?php

namespace App\Actions;

use App\Enums\GigExitExecutionMode;
use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Models\GigAgreement;
use App\Models\GigExitRequest;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigOffenseService;
use App\Services\GigSettlementService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class ProceedWithLockedGigExit
{
    public function __construct(private GigSettlementService $settlements, private GigOffenseService $offenses, private NotificationService $notifications) {}

    public function execute(User $actor, GigExitRequest $request): GigExitRequest
    {
        [$result, $recipientId] = DB::transaction(function () use ($actor, $request): array {
            $persisted = GigExitRequest::query()->findOrFail($request->id);
            $agreementId = $persisted->gig->currentPayment()->value('gig_agreement_id');
            $agreement = GigAgreement::query()->findOrFail($agreementId, ['id', 'gig_offer_id']);
            $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
            if ($freelancerId === null) {
                throw new DomainException('Selected offer no longer exists.');
            }
            $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            User::query()->lockForUpdate()->findOrFail($persisted->gig->client_id);
            $gig = $persisted->gig()->lockForUpdate()->firstOrFail();
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $payment = GigPayment::query()->lockForUpdate()->where('gig_id', $gig->id)->latest('id')->firstOrFail();
            $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
            $locked = GigExitRequest::query()->lockForUpdate()->findOrFail($persisted->id);
            if ($locked->requester_id !== $actor->id) {
                throw new AuthorizationException('Only the requester may proceed.');
            }
            if ($gig->status !== GigStatus::Locked || ! in_array($locked->status, [GigExitStatus::Pending, GigExitStatus::Refused], true)) {
                throw new DomainException('Exit request cannot proceed in the current state.');
            }
            if ($payment->status !== GigPaymentStatus::Paid || $lockedAgreement->gig_id !== $gig->id || $payment->gig_id !== $gig->id || $payment->gig_agreement_id !== $lockedAgreement->id || $offer->status !== GigOfferStatus::ACCEPTED) {
                throw new DomainException('Exit request associations are no longer valid.');
            }
            $outcome = $locked->type === GigExitType::ClientCancellation ? GigSettlementOutcome::ThirtySeventy : GigSettlementOutcome::FullClientRefund;
            $locked->status = GigExitStatus::Executed;
            $locked->execution_mode = GigExitExecutionMode::Unilateral;
            $locked->executed_at = now();
            $locked->save();
            $this->settlements->record($gig, $payment, $outcome, $locked);
            if ($locked->type === GigExitType::FreelancerAbandonment) {
                $this->offenses->record($freelancer, $gig, $locked);
            }
            $gig->status = GigStatus::Cancelled;
            $gig->cancelled_at = now();
            $gig->save();

            return [$locked->refresh(), $locked->responder_id];
        }, attempts: 3);

        try {
            $this->notifications->send('Permintaan keluar gig dieksekusi', NotificationTargetType::User, $actor->id, 'Permintaan keluar gig telah dieksekusi.', [$recipientId], action_url: route('app.gigs.workflow.show', $result->gig_id), action_label: 'Lihat Workflow');
        } catch (Throwable $exception) {
            report($exception);
        }

        return $result;
    }
}
