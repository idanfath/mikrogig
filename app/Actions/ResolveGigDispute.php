<?php

namespace App\Actions;

use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\GigAgreement;
use App\Models\GigDispute;
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

final class ResolveGigDispute
{
    public function __construct(
        private GigSettlementService $settlements,
        private GigOffenseService $offenses,
        private NotificationService $notifications,
    ) {}

    public function execute(User $admin, GigDispute $dispute, GigDisputeFinding $finding, ?GigSettlementOutcome $inconclusiveOutcome, string $resolutionNote): GigDispute
    {
        $source = GigDispute::query()->findOrFail($dispute->id, ['id', 'gig_id', 'gig_agreement_id', 'gig_payment_id']);
        $agreement = GigAgreement::query()->findOrFail($source->gig_agreement_id, ['id', 'gig_offer_id']);
        $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
        $clientId = $source->gig()->value('client_id');

        if ($freelancerId === null || $clientId === null) {
            throw new DomainException('Gig participants no longer exist.');
        }

        [$resolved, $participantIds, $offenderId] = DB::transaction(function () use ($admin, $source, $agreement, $freelancerId, $clientId, $finding, $inconclusiveOutcome, $resolutionNote): array {
            $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $client = User::query()->lockForUpdate()->findOrFail($clientId);
            $gig = $source->gig()->lockForUpdate()->firstOrFail();
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $payment = GigPayment::query()->lockForUpdate()->findOrFail($source->gig_payment_id);
            $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
            $locked = GigDispute::query()->lockForUpdate()->findOrFail($source->id);

            if ($admin->role !== UserRole::Admin) {
                throw new AuthorizationException('Only admins may resolve disputes.');
            }
            if ($locked->status !== GigDisputeStatus::AwaitingAdmin) {
                throw new DomainException('Dispute cannot be resolved in the current state.');
            }
            if ($resolutionNote === '') {
                throw new DomainException('Resolution note is required.');
            }
            if ($gig->status !== GigStatus::Disputed || $payment->status !== GigPaymentStatus::Paid || $locked->gig_id !== $gig->id || $locked->gig_agreement_id !== $lockedAgreement->id || $locked->gig_payment_id !== $payment->id || $payment->gig_id !== $gig->id || $payment->gig_agreement_id !== $lockedAgreement->id || $offer->freelancer_id !== $freelancer->id) {
                throw new DomainException('Dispute associations are no longer valid.');
            }

            $outcome = match ($finding) {
                GigDisputeFinding::FreelancerAtFault => GigSettlementOutcome::FullClientRefund,
                GigDisputeFinding::ClientAtFault => GigSettlementOutcome::ThirtySeventy,
                GigDisputeFinding::Inconclusive => $inconclusiveOutcome ?? throw new DomainException('Inconclusive finding requires a settlement outcome.'),
            };
            if ($finding !== GigDisputeFinding::Inconclusive && $inconclusiveOutcome !== null) {
                throw new DomainException('Only inconclusive findings may choose a settlement outcome.');
            }

            $offender = $finding === GigDisputeFinding::FreelancerAtFault ? $freelancer : ($finding === GigDisputeFinding::ClientAtFault ? $client : null);
            $this->settlements->record($gig, $payment, $outcome, dispute: $locked);
            if ($offender !== null) {
                $this->offenses->record($offender, $gig, dispute: $locked);
            }

            $locked->status = GigDisputeStatus::Resolved;
            $locked->finding = $finding;
            $locked->resolver()->associate($admin);
            $locked->resolution_note = $resolutionNote;
            $locked->resolved_at = now();
            $locked->save();
            $gig->status = GigStatus::DisputeResolved;
            $gig->save();

            return [$locked->refresh(), [$client->id, $freelancer->id], $offender?->id];
        }, attempts: 3);

        try {
            $this->notifications->send(
                'Sengketa gig diselesaikan',
                NotificationTargetType::Users,
                $admin->id,
                'Admin telah menyelesaikan sengketa gig Anda.',
                $participantIds,
                action_url: route('app.gig_disputes.show', $resolved),
                action_label: 'Lihat Sengketa',
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        if ($offenderId !== null) {
            try {
                $this->notifications->send(
                    'Pelanggaran gig tercatat',
                    NotificationTargetType::User,
                    $admin->id,
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
