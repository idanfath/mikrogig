<?php

namespace App\Console\Commands;

use App\Actions\Workflow\AutoAcceptGigFinishRequest;
use App\Models\GigFinishRequest;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

#[Signature('gig-finish-requests:auto-accept')]
#[Description('Automatically accept overdue gig finish requests.')]
class AutoAcceptGigFinishRequests extends Command
{
    public function handle(AutoAcceptGigFinishRequest $action): int
    {
        GigFinishRequest::query()
            ->reviewDue()
            ->orderBy('id')
            ->eachById(function (GigFinishRequest $finishRequest) use ($action): void {
                try {
                    $action->execute($finishRequest);
                } catch (Throwable $exception) {
                    report($exception);
                }
            });

        return self::SUCCESS;
    }
}
