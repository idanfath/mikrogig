<?php

namespace App\Actions;

use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeSubmissionType;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\GigAgreement;
use App\Models\GigDispute;
use App\Models\GigDisputeSubmission;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigDisputeEvidenceService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

final class SubmitGigDisputeCounterproof
{
    public function __construct(private GigDisputeEvidenceService $evidence, private NotificationService $notifications) {}

    /** @param array<int, UploadedFile> $photos */
    public function execute(User $respondent, GigDispute $dispute, string $statement, array $photos): GigDispute
    {
        if (trim($statement) === '' || mb_strlen($statement) > 5000) {
            throw new DomainException('Counterproof statement must be between one and 5000 characters.');
        }

        $paths = $this->evidence->store($photos);
        try {
            $source = GigDispute::query()->findOrFail($dispute->id, ['id', 'gig_id', 'gig_agreement_id', 'gig_payment_id']);
            $agreement = GigAgreement::query()->findOrFail($source->gig_agreement_id, ['id', 'gig_offer_id']);
            $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
            $clientId = $source->gig()->value('client_id');
            if ($freelancerId === null || $clientId === null) {
                throw new DomainException('Gig participants no longer exist.');
            }

            [$lockedDispute, $reporterId] = DB::transaction(function () use ($respondent, $source, $agreement, $freelancerId, $clientId, $statement, $paths): array {
                User::query()->lockForUpdate()->findOrFail($freelancerId);
                User::query()->lockForUpdate()->findOrFail($clientId);
                $gig = $source->gig()->lockForUpdate()->firstOrFail();
                $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
                $payment = GigPayment::query()->lockForUpdate()->findOrFail($source->gig_payment_id);
                $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
                $locked = GigDispute::query()->lockForUpdate()->findOrFail($source->id);

                if ($locked->respondent_id !== $respondent->id) {
                    throw new AuthorizationException('Only the dispute respondent may submit counterproof.');
                }
                if ($locked->status !== GigDisputeStatus::AwaitingCounterproof || ! $locked->counterproof_due_at->isFuture()) {
                    throw new DomainException('Counterproof cannot be submitted in the current state.');
                }
                if ($locked->gig_id !== $gig->id || $locked->gig_agreement_id !== $lockedAgreement->id || $locked->gig_payment_id !== $payment->id || $payment->gig_id !== $gig->id || $payment->gig_agreement_id !== $lockedAgreement->id || $offer->freelancer_id !== $freelancerId) {
                    throw new DomainException('Dispute associations are no longer valid.');
                }
                if ($locked->submissions()->where('type', GigDisputeSubmissionType::Counterproof)->exists()) {
                    throw new DomainException('Counterproof already exists.');
                }

                $submission = new GigDisputeSubmission(['type' => GigDisputeSubmissionType::Counterproof, 'statement' => $statement, 'submitted_at' => now()]);
                $submission->dispute()->associate($locked);
                $submission->author()->associate($respondent);
                $submission->save();
                foreach ($paths as $path) {
                    $submission->media()->create(['path' => $path]);
                }
                $locked->status = GigDisputeStatus::AwaitingAdmin;
                $locked->save();

                return [$locked->refresh(), $locked->reporter_id];
            }, attempts: 3);
        } catch (Throwable $exception) {
            $this->evidence->delete($paths);
            throw $exception;
        }

        try {
            $this->notifications->send('Counterproof sengketa dikirim', NotificationTargetType::User, $respondent->id, 'Counterproof telah dikirim dan menunggu admin.', [$reporterId], action_url: route('app.gig_disputes.show', $lockedDispute), action_label: 'Lihat Sengketa');
        } catch (Throwable $exception) {
            report($exception);
        }
        try {
            $this->notifications->send('Tindakan admin diperlukan', NotificationTargetType::Role, $respondent->id, 'Counterproof sengketa gig menunggu keputusan admin.', role: UserRole::Admin->value, action_url: route('app.admin.gig_disputes.show', $lockedDispute), action_label: 'Tinjau Sengketa');
        } catch (Throwable $exception) {
            report($exception);
        }

        return $lockedDispute;
    }
}
