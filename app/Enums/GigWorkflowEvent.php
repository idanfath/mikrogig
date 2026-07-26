<?php

namespace App\Enums;

enum GigWorkflowEvent: string
{
    case FreelancerSelected = 'freelancer_selected';
    case AgreementTermsSubmitted = 'agreement_terms_submitted';
    case AgreementChangesRequested = 'agreement_changes_requested';
    case AgreementAccepted = 'agreement_accepted';
    case AgreementDeclined = 'agreement_declined';
    case FreelancerLeft = 'freelancer_left';
    case SelectedFreelancerRejected = 'selected_freelancer_rejected';
    case PaymentPending = 'payment_pending';
    case PaymentConfirmed = 'payment_confirmed';
    case PaymentCancelled = 'payment_cancelled';
    case PaymentExpired = 'payment_expired';
    case WorkStarted = 'work_started';
    case ExitRequested = 'exit_requested';
    case ExitAccepted = 'exit_accepted';
    case ExitRefused = 'exit_refused';
    case ExitWithdrawn = 'exit_withdrawn';
    case ExitProceeded = 'exit_proceeded';
    case FinishSubmitted = 'finish_submitted';
    case FinishRejected = 'finish_rejected';
    case GigCompleted = 'gig_completed';
    case DisputeOpened = 'dispute_opened';
    case CounterproofSubmitted = 'counterproof_submitted';
    case DisputeResolved = 'dispute_resolved';
    case GigCancelled = 'gig_cancelled';
}
