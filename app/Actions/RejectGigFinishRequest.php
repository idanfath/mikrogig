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
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class RejectGigFinishRequest
{
    public function __construct(private NotificationService $notifications) {}

    public function execute(User $client, GigFinishRequest $finishRequest, string $reason): GigFinishRequest
    {
        if (Str::of($reason)->trim()->isEmpty() || Str::length($reason) > 5000) {
            throw new DomainException('Rejection reason must be between one and 5000 characters.');
        }

        [$rejected, $freelancerId] = DB::transaction(function () use ($client, $finishRequest, $reason): array {
            $source = GigFinishRequest::query()->findOrFail($finishRequest->id);
            $payment = GigPayment::query()->findOrFail($source->gig_payment_id, ['id', 'gig_id', 'gig_agreement_id']);
            $agreement = GigAgreement::query()->findOrFail($payment->gig_agreement_id, ['id', 'gig_id', 'gig_offer_id']);
            $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
            if ($freelancerId === null) {
                throw new DomainException('Selected offer no longer exists.');
            }

            $freelancer = User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedClient = User::query()->lockForUpdate()->findOrFail($source->gig()->value('client_id'));
            $gig = Gig::query()->lockForUpdate()->findOrFail($source->gig_id);
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $lockedPayment = GigPayment::query()->lockForUpdate()->findOrFail($payment->id);
            $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->sole();
            $locked = GigFinishRequest::query()->lockForUpdate()->findOrFail($source->id);

            if ($client->role !== UserRole::Client || $client->id !== $lockedClient->id) {
                throw new AuthorizationException('Only the owning client may reject completion.');
            }
            if ($locked->status !== GigFinishRequestStatus::Pending
                || $gig->status !== GigStatus::Review
                || ! $locked->review_due_at->isFuture()
                || $locked->gig_id !== $gig->id
                || $locked->gig_payment_id !== $lockedPayment->id
                || $locked->freelancer_id !== $freelancer->id
                || $lockedPayment->status !== GigPaymentStatus::Paid
                || $lockedAgreement->gig_id !== $gig->id
                || $lockedPayment->gig_id !== $gig->id
                || $lockedPayment->gig_agreement_id !== $lockedAgreement->id
                || $offer->status !== GigOfferStatus::ACCEPTED
                || $offer->freelancer_id !== $freelancer->id
                || $gig->dispute()->exists()
                || $gig->settlement()->exists()) {
                throw new DomainException('Completion cannot be rejected in the current state.');
            }

            $locked->status = GigFinishRequestStatus::Rejected;
            $locked->reviewer()->associate($lockedClient);
            $locked->rejection_reason = $reason;
            $locked->rejected_at = now();
            $locked->save();
            $gig->status = GigStatus::InProgress;
            $gig->save();

            return [$locked->refresh(), $freelancer->id];
        }, attempts: 3);

        try {
            $this->notifications->send(
                'Permintaan Revisi Pekerjaan',
                NotificationTargetType::User,
                $client->id,
                "{$client->name} meminta revisi pada pengajuan hasil pekerjaan gig \"{$rejected->gig->title}\". Catatan revisi: {$reason}",
                [$freelancerId],
                action_url: route('app.gigs.workflow.show', $rejected->gig_id),
                action_label: 'Lihat Alasan',
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $rejected;
    }
}
