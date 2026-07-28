<?php

namespace App\Actions\Workflow;

use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigRealtimeChange;
use App\Enums\GigStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigExitRequest;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\GigRealtimeService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class RequestLockedGigExit
{
    public function __construct(
        private NotificationService $notifications,
        private GigRealtimeService $realtime,
    ) {}

    public function execute(User $actor, Gig $gig, GigExitType $type, string $reason): GigExitRequest
    {
        $payment = $gig->currentPayment()->firstOrFail(['id', 'gig_agreement_id']);
        $agreement = GigAgreement::query()->findOrFail($payment->gig_agreement_id, ['id', 'gig_offer_id']);
        $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }
        [$request, $recipient] = DB::transaction(function () use ($actor, $gig, $type, $reason, $payment, $agreement, $freelancerId): array {
            User::query()->lockForUpdate()->findOrFail($freelancerId);
            $lockedClient = User::query()->lockForUpdate()->findOrFail($gig->client_id);
            $lockedGig = Gig::query()->lockForUpdate()->findOrFail($gig->id);
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $lockedPayment = GigPayment::query()->lockForUpdate()->findOrFail($payment->id);
            $offer = GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->firstOrFail();
            if ($lockedGig->status !== GigStatus::Locked || $lockedPayment->status !== GigPaymentStatus::Paid || $lockedAgreement->freelancer_confirmed_at === null || $offer->status !== GigOfferStatus::ACCEPTED || $lockedAgreement->gig_id !== $lockedGig->id || $lockedPayment->gig_id !== $lockedGig->id || $lockedPayment->gig_agreement_id !== $lockedAgreement->id || $lockedPayment->amount !== $lockedAgreement->final_total_price || $offer->freelancer_id !== $freelancerId || $lockedGig->dispute()->exists() || $lockedGig->settlement()->exists() || $lockedGig->exitRequests()->active()->exists()) {
                throw new DomainException('Gig cannot receive an exit request in the current state.');
            }
            $isClientRequest = $type === GigExitType::ClientCancellation && $actor->role === UserRole::Client && $actor->id === $lockedClient->id;
            $isFreelancerRequest = $type === GigExitType::FreelancerAbandonment && $actor->role === UserRole::Freelancer && $actor->id === $freelancerId;
            if (! $isClientRequest && ! $isFreelancerRequest) {
                throw new AuthorizationException('Actor cannot make this exit request.');
            }
            $request = new GigExitRequest(['type' => $type, 'reason' => $reason]);
            $request->gig()->associate($lockedGig);
            $request->requester()->associate($actor);
            $request->responder()->associate($isClientRequest ? $freelancerId : $lockedClient->id);
            $request->status = GigExitStatus::Pending;
            $request->save();

            return [$request->refresh(), $request->responder_id];
        }, attempts: 3);
        $this->realtime->stateChanged($gig, GigRealtimeChange::Workflow, [$actor->id, $recipient]);

        try {
            $this->notifications->send(
                'Permintaan Keluar Gig',
                NotificationTargetType::User,
                $actor->id,
                "{$actor->name} mengajukan permintaan keluar dari gig \"{$gig->title}\". Catatan alasan: {$reason}",
                [$recipient],
                action_url: route('app.gigs.workflow.show', $gig),
                action_label: 'Lihat Workflow'
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $request;
    }
}
