<?php

namespace App\Observers;

use App\Enums\GigAgreementClosureReason;
use App\Enums\GigDisputeStatus;
use App\Enums\GigExitExecutionMode;
use App\Enums\GigExitStatus;
use App\Enums\GigFinishRequestStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Enums\GigWorkflowEvent;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigDispute;
use App\Models\GigExitRequest;
use App\Models\GigFinishRequest;
use App\Models\GigPayment;
use App\Services\GigConversationService;
use Illuminate\Database\Eloquent\Model;

class GigConversationObserver
{
    public function __construct(private GigConversationService $conversations) {}

    public function created(Model $model): void
    {
        match (true) {
            $model instanceof GigAgreement => $this->record(
                $model,
                GigWorkflowEvent::FreelancerSelected,
                "agreement:{$model->id}:selected",
                ['accepted_fee' => $model->accepted_fee],
            ),
            $model instanceof GigPayment => $this->record(
                $model->agreement,
                GigWorkflowEvent::PaymentPending,
                "payment:{$model->id}:pending",
                ['amount' => $model->amount, 'currency' => $model->currency],
            ),
            $model instanceof GigExitRequest => $this->record(
                $this->agreementForGig($model->gig),
                GigWorkflowEvent::ExitRequested,
                "exit:{$model->id}:requested",
                ['type' => $model->type->value, 'reason' => $model->reason],
            ),
            $model instanceof GigFinishRequest => $this->record(
                $model->payment->agreement,
                GigWorkflowEvent::FinishSubmitted,
                "finish:{$model->id}:submitted",
                [
                    'completion_note' => $model->completion_note,
                    'review_due_at' => $model->review_due_at?->toISOString(),
                ],
            ),
            $model instanceof GigDispute => $this->record(
                $model->agreement,
                GigWorkflowEvent::DisputeOpened,
                "dispute:{$model->id}:opened",
                [
                    'type' => $model->type->value,
                    'counterproof_due_at' => $model->counterproof_due_at?->toISOString(),
                ],
            ),
            default => null,
        };
    }

    public function updated(Model $model): void
    {
        match (true) {
            $model instanceof GigAgreement => $this->agreementUpdated($model),
            $model instanceof GigPayment => $this->paymentUpdated($model),
            $model instanceof Gig => $this->gigUpdated($model),
            $model instanceof GigExitRequest => $this->exitUpdated($model),
            $model instanceof GigFinishRequest => $this->finishUpdated($model),
            $model instanceof GigDispute => $this->disputeUpdated($model),
            default => null,
        };
    }

    private function agreementUpdated(GigAgreement $agreement): void
    {
        if ($agreement->wasChanged('submitted_at') && $agreement->submitted_at !== null) {
            $this->record(
                $agreement,
                GigWorkflowEvent::AgreementTermsSubmitted,
                "agreement:{$agreement->id}:terms:v{$agreement->terms_version}",
                [
                    'terms_version' => $agreement->terms_version,
                    'final_scope' => $agreement->final_scope,
                    'work_date' => $agreement->work_date?->toDateString(),
                    'start_time' => $agreement->start_time,
                    'location_arrangement' => $agreement->location_arrangement,
                    'delivery_expectations' => $agreement->delivery_expectations,
                    'final_total_price' => $agreement->final_total_price,
                ],
            );
        }

        if ($agreement->wasChanged('change_requested_at') && $agreement->change_requested_at !== null) {
            $this->record(
                $agreement,
                GigWorkflowEvent::AgreementChangesRequested,
                "agreement:{$agreement->id}:changes:{$agreement->terms_version}",
                ['note' => $agreement->latest_change_request_note, 'terms_version' => $agreement->terms_version],
            );
        }

        if ($agreement->wasChanged('freelancer_confirmed_at') && $agreement->freelancer_confirmed_at !== null) {
            $this->record(
                $agreement,
                GigWorkflowEvent::AgreementAccepted,
                "agreement:{$agreement->id}:accepted",
                ['terms_version' => $agreement->terms_version, 'final_total_price' => $agreement->final_total_price],
            );
        }

        if (! $agreement->wasChanged('closed_at') || $agreement->closed_at === null) {
            return;
        }

        $event = match ($agreement->closure_reason) {
            GigAgreementClosureReason::FreelancerDeclined => GigWorkflowEvent::AgreementDeclined,
            GigAgreementClosureReason::FreelancerLeft => GigWorkflowEvent::FreelancerLeft,
            GigAgreementClosureReason::ClientRejected => GigWorkflowEvent::SelectedFreelancerRejected,
            default => null,
        };

        if ($event !== null) {
            $this->record(
                $agreement,
                $event,
                "agreement:{$agreement->id}:closed:{$agreement->closure_reason->value}",
            );
        }
    }

    private function paymentUpdated(GigPayment $payment): void
    {
        if (! $payment->wasChanged('status')) {
            return;
        }

        $event = match ($payment->status) {
            GigPaymentStatus::Paid => GigWorkflowEvent::PaymentConfirmed,
            GigPaymentStatus::Cancelled => GigWorkflowEvent::PaymentCancelled,
            GigPaymentStatus::Expired => GigWorkflowEvent::PaymentExpired,
            default => null,
        };

        if ($event !== null) {
            $this->record(
                $payment->agreement,
                $event,
                "payment:{$payment->id}:{$payment->status->value}",
                ['amount' => $payment->amount, 'currency' => $payment->currency],
            );
        }
    }

    private function gigUpdated(Gig $gig): void
    {
        if (! $gig->wasChanged('status')) {
            return;
        }

        $agreement = $this->agreementForGig($gig);
        if ($agreement === null) {
            return;
        }

        if ($gig->status === GigStatus::InProgress && $gig->started_at !== null) {
            $this->record($agreement, GigWorkflowEvent::WorkStarted, "gig:{$gig->id}:started", [
                'started_at' => $gig->started_at->toISOString(),
            ]);
        }

        if ($gig->status === GigStatus::Cancelled) {
            $this->record($agreement, GigWorkflowEvent::GigCancelled, "gig:{$gig->id}:cancelled", [
                'cancelled_at' => $gig->cancelled_at?->toISOString(),
            ]);
        }
    }

    private function exitUpdated(GigExitRequest $exit): void
    {
        if (! $exit->wasChanged('status')) {
            return;
        }

        $event = match ($exit->status) {
            GigExitStatus::Refused => GigWorkflowEvent::ExitRefused,
            GigExitStatus::Withdrawn => GigWorkflowEvent::ExitWithdrawn,
            GigExitStatus::Executed => $exit->execution_mode === GigExitExecutionMode::Agreed
                ? GigWorkflowEvent::ExitAccepted
                : GigWorkflowEvent::ExitProceeded,
            default => null,
        };

        if ($event !== null) {
            $this->record(
                $this->agreementForGig($exit->gig),
                $event,
                "exit:{$exit->id}:{$exit->status->value}",
                [
                    'type' => $exit->type->value,
                    'execution_mode' => $exit->execution_mode?->value,
                ],
            );
        }
    }

    private function finishUpdated(GigFinishRequest $finish): void
    {
        if (! $finish->wasChanged('status')) {
            return;
        }

        if ($finish->status === GigFinishRequestStatus::Rejected) {
            $this->record(
                $finish->payment->agreement,
                GigWorkflowEvent::FinishRejected,
                "finish:{$finish->id}:rejected",
                ['reason' => $finish->rejection_reason],
            );
        }

        if (in_array($finish->status, [GigFinishRequestStatus::Accepted, GigFinishRequestStatus::AutoAccepted], true)) {
            $this->record(
                $finish->payment->agreement,
                GigWorkflowEvent::GigCompleted,
                "finish:{$finish->id}:{$finish->status->value}",
                ['mode' => $finish->status->value],
            );
        }
    }

    private function disputeUpdated(GigDispute $dispute): void
    {
        if (! $dispute->wasChanged('status')) {
            return;
        }

        if ($dispute->status === GigDisputeStatus::AwaitingAdmin) {
            $this->record(
                $dispute->agreement,
                GigWorkflowEvent::CounterproofSubmitted,
                "dispute:{$dispute->id}:counterproof",
            );
        }

        if ($dispute->status === GigDisputeStatus::Resolved) {
            $this->record(
                $dispute->agreement,
                GigWorkflowEvent::DisputeResolved,
                "dispute:{$dispute->id}:resolved",
                [
                    'finding' => $dispute->finding?->value,
                    'resolution_note' => $dispute->resolution_note,
                ],
            );
        }
    }

    private function agreementForGig(Gig $gig): ?GigAgreement
    {
        return $gig->agreements()->latest('id')->first();
    }

    /**
     * @param  array<string, mixed>  $snapshot
     */
    private function record(
        ?GigAgreement $agreement,
        GigWorkflowEvent $event,
        string $key,
        array $snapshot = [],
    ): void {
        if ($agreement !== null) {
            $this->conversations->record($agreement, $event, $key, $snapshot);
        }
    }
}
