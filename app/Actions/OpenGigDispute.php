<?php

namespace App\Actions;

use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeSubmissionType;
use App\Enums\GigDisputeType;
use App\Enums\GigFinishRequestStatus;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigDispute;
use App\Models\GigDisputeSubmission;
use App\Models\GigFinishRequest;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigWorkflowEvidenceService;
use App\Services\NotificationService;
use Carbon\CarbonImmutable;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class OpenGigDispute
{
    public function __construct(
        private GigWorkflowEvidenceService $evidence,
        private NotificationService $notifications,
    ) {}

    /** @param array<int, UploadedFile> $photos */
    public function execute(User $reporter, Gig $gig, GigDisputeType $type, string $statement, array $photos): GigDispute
    {
        if (Str::of($statement)->trim()->isEmpty() || Str::length($statement) > 5000) {
            throw new DomainException('Dispute statement must be between one and 5000 characters.');
        }

        $paths = $this->evidence->store($photos, $type === GigDisputeType::FinishRejected ? 0 : 1);

        try {
            $payment = $gig->currentPayment()->firstOrFail(['id', 'gig_agreement_id']);
            $agreement = GigAgreement::query()->findOrFail($payment->gig_agreement_id, ['id', 'gig_offer_id', 'work_date', 'start_time']);
            $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
            if ($freelancerId === null) {
                throw new DomainException('Selected offer no longer exists.');
            }

            [$dispute, $respondentId] = DB::transaction(function () use ($reporter, $gig, $type, $statement, $paths, $payment, $agreement, $freelancerId): array {
                $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
                $client = User::query()->lockForUpdate()->findOrFail($gig->client_id);
                $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
                $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
                $lockedPayment = GigPayment::query()->lockForUpdate()->findOrFail($payment->id);
                $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
                $latestFinishRequest = $type === GigDisputeType::FinishRejected
                    ? GigFinishRequest::query()->where('gig_id', $lockedGig->id)->latest('id')->lockForUpdate()->first()
                    : null;

                if ($lockedPayment->status !== GigPaymentStatus::Paid
                    || $offer->status !== GigOfferStatus::ACCEPTED
                    || $lockedAgreement->gig_id !== $lockedGig->id
                    || $lockedPayment->gig_id !== $lockedGig->id
                    || $lockedPayment->gig_agreement_id !== $lockedAgreement->id
                    || $lockedPayment->amount !== $lockedAgreement->final_total_price
                    || $offer->freelancer_id !== $freelancer->id
                    || $lockedGig->dispute()->exists()
                    || $lockedGig->settlement()->exists()) {
                    throw new DomainException('Gig cannot be disputed in the current state.');
                }

                $isNoShow = $type === GigDisputeType::NoShow;
                $isFreelancerReport = in_array($type, [
                    GigDisputeType::StartBlocked,
                    GigDisputeType::WorkObstruction,
                    GigDisputeType::FinishRejected,
                ], true);
                $authorizedReporter = ($isNoShow
                    && $reporter->role === UserRole::Client
                    && $reporter->id === $client->id)
                    || ($isFreelancerReport
                        && $reporter->role === UserRole::Freelancer
                        && $reporter->id === $freelancer->id);

                if (! $authorizedReporter) {
                    throw new AuthorizationException('Reporter cannot open this dispute type.');
                }

                $requiredStatus = in_array($type, [GigDisputeType::NoShow, GigDisputeType::StartBlocked], true)
                    ? GigStatus::Locked
                    : GigStatus::InProgress;
                if ($lockedGig->status !== $requiredStatus) {
                    throw new DomainException('Gig cannot be disputed in the current state.');
                }
                if ($type === GigDisputeType::FinishRejected
                    && ($latestFinishRequest?->status !== GigFinishRequestStatus::Rejected
                        || $latestFinishRequest->gig_payment_id !== $lockedPayment->id)) {
                    throw new DomainException('Only the latest rejected completion may be disputed.');
                }

                if (in_array($type, [GigDisputeType::NoShow, GigDisputeType::StartBlocked], true)) {
                    if ($lockedGig->exitRequests()->active()->exists()) {
                        throw new DomainException('Gig has an active exit request.');
                    }

                    $scheduledAt = CarbonImmutable::parse(
                        $lockedAgreement->work_date->toDateString().' '.$lockedAgreement->start_time,
                        config('app.timezone'),
                    );
                    if (now(config('app.timezone'))->lt($scheduledAt)) {
                        throw new DomainException('Disputes are available after the agreed start time.');
                    }
                }

                $dispute = new GigDispute([
                    'type' => $type,
                    'opened_at' => now(),
                    'counterproof_due_at' => now()->addDay(),
                ]);
                $dispute->gig()->associate($lockedGig);
                $dispute->agreement()->associate($lockedAgreement);
                $dispute->payment()->associate($lockedPayment);
                $dispute->reporter()->associate($reporter);
                $dispute->respondent()->associate($isNoShow ? $freelancer : $client);
                if ($type === GigDisputeType::FinishRejected) {
                    $dispute->finishRequest()->associate($latestFinishRequest);
                }
                $dispute->status = GigDisputeStatus::AwaitingCounterproof;
                $dispute->save();

                $submission = new GigDisputeSubmission([
                    'type' => GigDisputeSubmissionType::Report,
                    'statement' => $statement,
                    'submitted_at' => now(),
                ]);
                $submission->dispute()->associate($dispute);
                $submission->author()->associate($reporter);
                $submission->save();

                foreach ($paths as $path) {
                    $submission->media()->create(['path' => $path]);
                }

                $lockedGig->status = GigStatus::Disputed;
                $lockedGig->save();

                return [$dispute->refresh(), $dispute->respondent_id];
            }, attempts: 3);
        } catch (Throwable $exception) {
            $this->evidence->delete($paths);

            throw $exception;
        }

        try {
            $this->notifications->send(
                'Sengketa gig dibuka',
                NotificationTargetType::User,
                $reporter->id,
                'Anda perlu menanggapi sengketa gig.',
                [$respondentId],
                action_url: route('app.gig_disputes.show', $dispute),
                action_label: 'Lihat Sengketa',
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        try {
            $this->notifications->send(
                'Sengketa gig baru dibuka',
                NotificationTargetType::Role,
                $reporter->id,
                'Sengketa gig baru telah dibuka dan menunggu counterproof.',
                role: UserRole::Admin->value,
                action_url: route('app.admin.gig_disputes.show', $dispute),
                action_label: 'Tinjau Sengketa',
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $dispute;
    }
}
