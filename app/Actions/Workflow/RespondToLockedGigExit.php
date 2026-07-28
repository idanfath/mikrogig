<?php

namespace App\Actions\Workflow;

use App\Enums\GigExitDecision;
use App\Enums\GigExitExecutionMode;
use App\Enums\GigExitStatus;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigRealtimeChange;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Models\GigAgreement;
use App\Models\GigExitRequest;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigRealtimeService;
use App\Services\GigSettlementService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class RespondToLockedGigExit
{
    public function __construct(
        private GigSettlementService $settlements,
        private NotificationService $notifications,
        private GigRealtimeService $realtime,
    ) {}

    public function execute(User $actor, GigExitRequest $request, GigExitDecision $decision): GigExitRequest
    {
        [$result, $recipientIds, $message] = DB::transaction(function () use ($actor, $request, $decision): array {
            $persisted = GigExitRequest::query()->findOrFail($request->id);
            $agreementId = $persisted->gig->currentPayment()->value('gig_agreement_id');
            $agreement = GigAgreement::query()->findOrFail($agreementId, ['id', 'gig_offer_id']);
            $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
            if ($freelancerId === null) {
                throw new DomainException('Selected offer no longer exists.');
            }
            User::query()->lockForUpdate()->findOrFail($freelancerId);
            User::query()->lockForUpdate()->findOrFail($persisted->gig->client_id);
            $gig = $persisted->gig()->lockForUpdate()->firstOrFail();
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $payment = GigPayment::query()->lockForUpdate()->where('gig_id', $gig->id)->latest('id')->firstOrFail();
            $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
            $lockedRequest = GigExitRequest::query()->lockForUpdate()->findOrFail($persisted->id);
            if ($actor->id !== $lockedRequest->responder_id) {
                throw new AuthorizationException('Only the counterparty may respond.');
            }
            if ($gig->status !== GigStatus::Locked || $lockedRequest->status !== GigExitStatus::Pending) {
                throw new DomainException('Exit request cannot be responded to in the current state.');
            }
            if ($payment->status !== GigPaymentStatus::Paid || $lockedAgreement->gig_id !== $gig->id || $payment->gig_id !== $gig->id || $payment->gig_agreement_id !== $lockedAgreement->id || $offer->status !== GigOfferStatus::ACCEPTED) {
                throw new DomainException('Exit request associations are no longer valid.');
            }
            $lockedRequest->response = $decision;
            $lockedRequest->responded_at = now();
            if ($decision === GigExitDecision::Refuse) {
                $lockedRequest->status = GigExitStatus::Refused;
                $lockedRequest->save();

                return [$lockedRequest->refresh(), [$lockedRequest->requester_id], 'Permintaan keluar gig ditolak.'];
            }
            $lockedRequest->status = GigExitStatus::Executed;
            $lockedRequest->execution_mode = GigExitExecutionMode::Agreed;
            $lockedRequest->executed_at = now();
            $lockedRequest->save();
            $this->settlements->record($gig, $payment, GigSettlementOutcome::FullClientRefund, $lockedRequest);
            $gig->status = GigStatus::Cancelled;
            $gig->cancelled_at = now();
            $gig->save();

            return [$lockedRequest->refresh(), [$lockedRequest->requester_id, $lockedRequest->responder_id], 'Permintaan keluar gig disetujui dan gig dibatalkan.'];
        }, attempts: 3);

        $this->realtime->stateChanged($result->gig_id, GigRealtimeChange::Workflow, $recipientIds);
        $settlement = $result->gig->settlement;
        $isRefused = $result->status === GigExitStatus::Refused;
        $title = $isRefused ? 'Permintaan Keluar Gig Ditolak' : 'Permintaan Keluar Gig Disetujui';
        $bodyMessage = $isRefused
            ? "{$actor->name} menolak permintaan keluar untuk gig \"{$result->gig->title}\"."
            : "{$actor->name} menyetujui permintaan keluar untuk gig \"{$result->gig->title}\". Gig dibatalkan dan pengembalian dana sebesar Rp ".number_format($settlement?->client_refund ?? 0, 0, ',', '.').' diproses ke klien.';

        foreach ($recipientIds as $recipientId) {
            try {
                $this->notifications->send(
                    $title,
                    NotificationTargetType::User,
                    $actor->id,
                    $bodyMessage,
                    [$recipientId],
                    action_url: $isRefused
                        ? route('app.gigs.workflow.show', $result->gig_id)
                        : route('app.history.show', $result->gig_id),
                    action_label: $isRefused ? 'Lihat Workflow' : 'Lihat Riwayat'
                );
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        return $result;
    }
}
