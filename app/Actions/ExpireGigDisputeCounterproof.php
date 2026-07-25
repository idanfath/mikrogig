<?php

namespace App\Actions;

use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigPaymentStatus;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Models\GigAgreement;
use App\Models\GigDispute;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigOffenseService;
use App\Services\GigSettlementService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class ExpireGigDisputeCounterproof
{
    public function __construct(
        private GigSettlementService $settlements,
        private GigOffenseService $offenses,
        private NotificationService $notifications,
    ) {}

    public function execute(GigDispute $dispute): GigDispute
    {
        $source = GigDispute::query()->findOrFail($dispute->id, ['id', 'gig_id', 'gig_agreement_id', 'gig_payment_id']);
        $agreement = GigAgreement::query()->findOrFail($source->gig_agreement_id, ['id', 'gig_offer_id']);
        $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
        $clientId = $source->gig()->value('client_id');

        if ($freelancerId === null || $clientId === null) {
            throw new DomainException('Gig participants no longer exist.');
        }

        [$resolved, $participantIds, $offenderId, $changed] = DB::transaction(function () use ($source, $agreement, $freelancerId, $clientId): array {
            $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $client = User::query()->lockForUpdate()->findOrFail($clientId);
            $gig = $source->gig()->lockForUpdate()->firstOrFail();
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $payment = GigPayment::query()->lockForUpdate()->findOrFail($source->gig_payment_id);
            $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
            $locked = GigDispute::query()->lockForUpdate()->findOrFail($source->id);

            if ($locked->status === GigDisputeStatus::Resolved) {
                return [$locked, [], null, false];
            }
            if ($locked->status !== GigDisputeStatus::AwaitingCounterproof || $locked->counterproof_due_at->isFuture()) {
                throw new DomainException('Dispute counterproof has not expired.');
            }
            if ($gig->status !== GigStatus::Disputed || $payment->status !== GigPaymentStatus::Paid || $locked->gig_id !== $gig->id || $locked->gig_agreement_id !== $lockedAgreement->id || $locked->gig_payment_id !== $payment->id || $payment->gig_id !== $gig->id || $payment->gig_agreement_id !== $lockedAgreement->id || $offer->freelancer_id !== $freelancer->id) {
                throw new DomainException('Dispute associations are no longer valid.');
            }

            $isNoShow = $locked->type === GigDisputeType::NoShow;
            $outcome = $isNoShow ? GigSettlementOutcome::FullClientRefund : GigSettlementOutcome::ThirtySeventy;
            $offender = $isNoShow ? $freelancer : $client;
            $this->settlements->record($gig, $payment, $outcome, dispute: $locked);
            $this->offenses->record($offender, $gig, dispute: $locked);
            $locked->status = GigDisputeStatus::Resolved;
            $locked->finding = $isNoShow ? GigDisputeFinding::FreelancerAtFault : GigDisputeFinding::ClientAtFault;
            $locked->resolved_at = now();
            $locked->resolution_note = 'Counterproof deadline expired.';
            $locked->save();
            $gig->status = GigStatus::DisputeResolved;
            $gig->save();

            return [$locked->refresh(), [$client->id, $freelancer->id], $offender->id, true];
        }, attempts: 3);

        if ($changed) {
            try {
                $this->notifications->send(
                    'Sengketa gig diselesaikan otomatis',
                    NotificationTargetType::Users,
                    null,
                    'Batas waktu counterproof berakhir dan sengketa telah diselesaikan.',
                    $participantIds,
                    action_url: route('app.gig_disputes.show', $resolved),
                    action_label: 'Lihat Sengketa',
                );
            } catch (Throwable $exception) {
                report($exception);
            }

            try {
                $this->notifications->send(
                    'Pelanggaran gig tercatat',
                    NotificationTargetType::User,
                    null,
                    'Pelanggaran gig telah tercatat pada akun Anda.',
                    [$offenderId],
                    action_url: route('app.gig_disputes.show', $resolved),
                    action_label: 'Lihat Sengketa',
                );
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        return $resolved;
    }
}
