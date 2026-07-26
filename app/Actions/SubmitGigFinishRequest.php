<?php

namespace App\Actions;

use App\Enums\GigFinishRequestStatus;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigFinishRequest;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigWorkflowEvidenceService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class SubmitGigFinishRequest
{
    public function __construct(
        private GigWorkflowEvidenceService $evidence,
        private NotificationService $notifications,
    ) {}

    /** @param array<int, UploadedFile> $photos */
    public function execute(User $freelancer, Gig $gig, string $completionNote, array $photos): GigFinishRequest
    {
        if (Str::of($completionNote)->trim()->isEmpty() || Str::length($completionNote) > 5000) {
            throw new DomainException('Completion note must be between one and 5000 characters.');
        }

        $paths = $this->evidence->store($photos);

        try {
            $payment = $gig->currentPayment()->firstOrFail(['id', 'gig_agreement_id']);
            $agreement = GigAgreement::query()->findOrFail($payment->gig_agreement_id, ['id', 'gig_id', 'gig_offer_id']);
            $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
            if ($freelancerId === null) {
                throw new DomainException('Selected offer no longer exists.');
            }

            [$finishRequest, $clientId] = DB::transaction(function () use ($freelancer, $gig, $completionNote, $paths, $payment, $agreement, $freelancerId): array {
                $lockedFreelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
                $client = User::query()->lockForUpdate()->findOrFail($gig->client_id);
                $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
                $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
                $lockedPayment = GigPayment::query()->lockForUpdate()->findOrFail($payment->id);
                $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
                $pendingRequests = GigFinishRequest::query()
                    ->where('gig_id', $lockedGig->id)
                    ->pending()
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                if ($freelancer->role !== UserRole::Freelancer || $freelancer->id !== $lockedFreelancer->id) {
                    throw new AuthorizationException('Only the accepted freelancer may submit completion proof.');
                }
                if ($lockedGig->status !== GigStatus::InProgress
                    || $lockedPayment->status !== GigPaymentStatus::Paid
                    || $offer->status !== GigOfferStatus::ACCEPTED
                    || $lockedAgreement->gig_id !== $lockedGig->id
                    || $lockedPayment->gig_id !== $lockedGig->id
                    || $lockedPayment->gig_agreement_id !== $lockedAgreement->id
                    || $lockedPayment->amount !== $lockedAgreement->final_total_price
                    || $offer->freelancer_id !== $lockedFreelancer->id
                    || $lockedGig->dispute()->exists()
                    || $lockedGig->settlement()->exists()
                    || $pendingRequests->isNotEmpty()) {
                    throw new DomainException('Gig cannot receive completion proof in the current state.');
                }

                $finishRequest = new GigFinishRequest([
                    'completion_note' => $completionNote,
                    'review_due_at' => now()->addDay(),
                ]);
                $finishRequest->gig()->associate($lockedGig);
                $finishRequest->payment()->associate($lockedPayment);
                $finishRequest->freelancer()->associate($lockedFreelancer);
                $finishRequest->status = GigFinishRequestStatus::Pending;
                $finishRequest->save();

                foreach ($paths as $path) {
                    $finishRequest->media()->create(['path' => $path]);
                }

                $lockedGig->status = GigStatus::Review;
                $lockedGig->save();

                return [$finishRequest->refresh(), $client->id];
            }, attempts: 3);
        } catch (Throwable $exception) {
            $this->evidence->delete($paths);

            throw $exception;
        }

        try {
            $this->notifications->send(
                'Pengajuan Hasil Pekerjaan',
                NotificationTargetType::User,
                $freelancer->id,
                "{$freelancer->name} telah mengajukan penyerahan hasil pekerjaan untuk gig \"{$gig->title}\".",
                [$clientId],
                action_url: route('app.gigs.workflow.show', $gig),
                action_label: 'Tinjau Pekerjaan',
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $finishRequest;
    }
}
