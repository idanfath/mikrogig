<?php

namespace App\Console\Commands;

use App\Actions\Payment\ExpireGigPayment;
use App\Models\GigPayment;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

#[Signature('gig-payments:expire')]
#[Description('Expire pending gig payments whose payment window has ended.')]
class ExpireGigPayments extends Command
{
    public function handle(ExpireGigPayment $expireGigPayment): int
    {
        GigPayment::query()
            ->pending()
            ->expiredDeadline()
            ->orderBy('id')
            ->eachById(function (GigPayment $payment) use ($expireGigPayment): void {
                try {
                    $expireGigPayment->execute($payment);
                } catch (Throwable $exception) {
                    report($exception);
                    $this->error("Failed to expire gig payment {$payment->id}.");
                }
            });

        return self::SUCCESS;
    }
}
