<?php

namespace App\Actions;

use App\Enums\GigDisputeAiOverviewStatus;
use App\Enums\GigDisputeStatus;
use App\Enums\UserRole;
use App\Jobs\GenerateGigDisputeAiOverview;
use App\Models\GigDispute;
use App\Models\GigDisputeAiOverview;
use App\Models\User;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class RequestGigDisputeAiOverview
{
    public function execute(User $admin, GigDispute $dispute): GigDisputeAiOverview
    {
        if ($admin->role !== UserRole::Admin) {
            throw new AuthorizationException('Only administrators may generate a dispute overview.');
        }

        [$overview, $shouldDispatch] = DB::transaction(function () use ($admin, $dispute): array {
            $lockedDispute = GigDispute::query()->lockForUpdate()->findOrFail($dispute->id);
            $overview = $lockedDispute->aiOverview()->lockForUpdate()->first();

            if ($overview !== null && $overview->status !== GigDisputeAiOverviewStatus::Failed) {
                return [$overview, false];
            }

            if ($lockedDispute->status !== GigDisputeStatus::AwaitingAdmin) {
                throw new DomainException('AI overview may only be requested while the dispute awaits admin review.');
            }

            if ($overview === null) {
                $overview = new GigDisputeAiOverview([
                    'status' => GigDisputeAiOverviewStatus::Queued,
                    'model' => config('ai.dispute_overview_model') ?: config('ai.model'),
                    'prompt_version' => 'v2',
                    'schema_version' => 'v2',
                    'queued_at' => now(),
                ]);
                $overview->dispute()->associate($lockedDispute);
                $overview->requester()->associate($admin);
                $overview->save();
            } else {
                $overview->forceFill([
                    'requested_by' => $admin->id,
                    'status' => GigDisputeAiOverviewStatus::Queued,
                    'prompt_version' => 'v2',
                    'schema_version' => 'v2',
                    'failure_detail' => null,
                    'queued_at' => now(),
                    'processing_at' => null,
                    'completed_at' => null,
                    'failed_at' => null,
                    'repair_attempted_at' => null,
                    'snapshot' => null,
                    'evidence_catalog' => null,
                    'coverage' => null,
                    'result' => null,
                ])->save();
            }

            return [$overview, true];
        }, attempts: 3);

        if ($shouldDispatch) {
            DB::afterCommit(fn () => GenerateGigDisputeAiOverview::dispatch($overview->id));
        }

        return $overview->refresh();
    }
}
