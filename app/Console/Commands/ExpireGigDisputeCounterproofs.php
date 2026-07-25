<?php

namespace App\Console\Commands;

use App\Actions\ExpireGigDisputeCounterproof;
use App\Models\GigDispute;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

#[Signature('gig-disputes:expire-counterproofs')]
#[Description('Expire overdue gig dispute counterproof windows.')]
class ExpireGigDisputeCounterproofs extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(ExpireGigDisputeCounterproof $action): int
    {
        GigDispute::query()->awaitingCounterproof()->where('counterproof_due_at', '<=', now())->orderBy('id')->eachById(function (GigDispute $dispute) use ($action): void {
            try {
                $action->execute($dispute);
            } catch (Throwable $exception) {
                report($exception);
            }
        });

        return self::SUCCESS;
    }
}
