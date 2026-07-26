<?php

namespace App\Actions;

use App\Enums\GigExitStatus;
use App\Enums\NotificationTargetType;
use App\Models\GigAgreement;
use App\Models\GigExitRequest;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class WithdrawLockedGigExit
{
    public function __construct(private NotificationService $notifications) {}

    public function execute(User $actor, GigExitRequest $request): GigExitRequest
    {
        $persisted = GigExitRequest::query()->findOrFail($request->id);
        $payment = $persisted->gig->currentPayment()->firstOrFail(['id', 'gig_agreement_id']);
        $agreement = GigAgreement::query()->findOrFail($payment->gig_agreement_id, ['id', 'gig_offer_id']);
        $freelancerId = GigOffer::query()->whereKey($agreement->gig_offer_id)->value('freelancer_id');
        if ($freelancerId === null) {
            throw new DomainException('Selected offer no longer exists.');
        }

        [$result, $responderId] = DB::transaction(function () use ($actor, $persisted, $payment, $agreement, $freelancerId): array {
            User::query()->lockForUpdate()->findOrFail($freelancerId);
            User::query()->lockForUpdate()->findOrFail($persisted->gig->client_id);
            $gig = $persisted->gig()->lockForUpdate()->firstOrFail();
            $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($agreement->id);
            GigPayment::query()->lockForUpdate()->findOrFail($payment->id);
            GigOffer::query()->whereKey([$lockedAgreement->gig_offer_id])->orderBy('id')->lockForUpdate()->get();
            $locked = GigExitRequest::query()->lockForUpdate()->findOrFail($persisted->id);
            if ($locked->requester_id !== $actor->id) {
                throw new AuthorizationException('Only the requester may withdraw this exit request.');
            }
            if (! in_array($locked->status, [GigExitStatus::Pending, GigExitStatus::Refused], true)) {
                throw new DomainException('Exit request cannot be withdrawn in the current state.');
            }
            if ($gig->id !== $locked->gig_id) {
                throw new DomainException('Exit request associations are no longer valid.');
            }
            $locked->status = GigExitStatus::Withdrawn;
            $locked->withdrawn_at = now();
            $locked->save();

            return [$locked->refresh(), $locked->responder_id];
        }, attempts: 3);

        try {
            $this->notifications->send(
                'Permintaan Keluar Ditarik',
                NotificationTargetType::User,
                $actor->id,
                "{$actor->name} telah menarik kembali pengajuan keluar dari gig \"{$result->gig->title}\".",
                [$responderId],
                action_url: route('app.gigs.workflow.show', $result->gig_id),
                action_label: 'Lihat Workflow'
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $result;
    }
}
