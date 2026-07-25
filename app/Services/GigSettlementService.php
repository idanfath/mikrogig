<?php

namespace App\Services;

use App\Enums\GigSettlementOutcome;
use App\Models\Gig;
use App\Models\GigDispute;
use App\Models\GigExitRequest;
use App\Models\GigPayment;
use App\Models\GigSettlement;
use DomainException;

final class GigSettlementService
{
    public function record(Gig $gig, GigPayment $payment, GigSettlementOutcome $outcome, ?GigExitRequest $exitRequest = null, ?GigDispute $dispute = null): GigSettlement
    {
        if ($gig->settlement()->exists()) {
            throw new DomainException('Gig already has a settlement.');
        }

        $agreement = $payment->agreement;
        if ($agreement->final_total_price === null || $agreement->final_total_price !== $payment->amount) {
            throw new DomainException('Paid amount does not match the agreed final total.');
        }

        $total = $agreement->final_total_price;
        [$freelancerPayout, $clientRefund] = match ($outcome) {
            GigSettlementOutcome::FullClientRefund => [0, $total],
            GigSettlementOutcome::ThirtySeventy => [intdiv($total * 30, 100), $total - intdiv($total * 30, 100)],
            GigSettlementOutcome::FullFreelancerPayout => [$total, 0],
        };

        $settlement = new GigSettlement([
            'total_amount' => $total,
            'freelancer_payout' => $freelancerPayout,
            'client_refund' => $clientRefund,
            'outcome' => $outcome,
            'recorded_at' => now(),
        ]);
        $settlement->gig()->associate($gig);
        $settlement->payment()->associate($payment);
        if ($exitRequest !== null) {
            $settlement->exitRequest()->associate($exitRequest);
        }
        if ($dispute !== null) {
            $settlement->dispute()->associate($dispute);
        }
        $settlement->save();

        return $settlement->refresh();
    }
}
