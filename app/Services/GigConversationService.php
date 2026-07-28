<?php

namespace App\Services;

use App\Enums\GigMessageKind;
use App\Enums\GigStatus;
use App\Enums\GigWorkflowEvent;
use App\Enums\UserRole;
use App\Events\GigMessageCreated;
use App\Events\GigMessagesRead;
use App\Http\Resources\GigMessageResource;
use App\Models\GigAgreement;
use App\Models\GigMessage;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class GigConversationService
{
    private const WRITABLE_STATUSES = [
        GigStatus::AgreementPreparation,
        GigStatus::LockPending,
        GigStatus::PaymentPending,
        GigStatus::Locked,
        GigStatus::InProgress,
        GigStatus::Review,
    ];

    private const TERMINAL_STATUSES = [
        GigStatus::Completed,
        GigStatus::Cancelled,
        GigStatus::DisputeResolved,
    ];

    /**
     * @return Collection<int, User>
     */
    public function participants(GigAgreement $agreement): Collection
    {
        $agreement->loadMissing(['gig.client', 'acceptedOffer.freelancer']);

        return collect([
            $agreement->gig->client,
            $agreement->acceptedOffer->freelancer,
        ]);
    }

    public function canView(User $user, GigAgreement $agreement): bool
    {
        $agreement->loadMissing(['gig.dispute', 'acceptedOffer']);
        $gig = $agreement->gig;
        $isParticipant = in_array($user->id, [
            $gig->client_id,
            $agreement->acceptedOffer->freelancer_id,
        ], true);

        if ($user->activeBan()->exists()) {
            return $isParticipant
                && in_array($gig->status, self::TERMINAL_STATUSES, true)
                && $this->isLatestAgreement($agreement);
        }

        if ($user->role === UserRole::Admin) {
            return in_array($gig->status, [GigStatus::Disputed, GigStatus::DisputeResolved], true)
                && $gig->dispute?->gig_agreement_id === $agreement->id;
        }

        if (! $isParticipant) {
            return false;
        }

        if (in_array($gig->status, self::TERMINAL_STATUSES, true)) {
            return $this->isLatestAgreement($agreement);
        }

        if ($gig->status === GigStatus::Disputed) {
            return $gig->dispute?->gig_agreement_id === $agreement->id;
        }

        return in_array($gig->status, self::WRITABLE_STATUSES, true)
            && $gig->currentAgreement()->whereKey($agreement->id)->exists();
    }

    public function canSend(User $user, GigAgreement $agreement): bool
    {
        return ! $user->activeBan()->exists()
            && $this->canView($user, $agreement)
            && $agreement->closed_at === null
            && in_array($agreement->gig->status, self::WRITABLE_STATUSES, true)
            && $agreement->gig->currentAgreement()->whereKey($agreement->id)->exists();
    }

    public function isWritableStatus(GigStatus $status): bool
    {
        return in_array($status, self::WRITABLE_STATUSES, true);
    }

    /**
     * @return array<string, mixed>
     */
    public function present(Request $request, GigAgreement $agreement): array
    {
        abort_unless($this->canView($request->user(), $agreement), 403);

        $before = $request->integer('chat_before') ?: null;
        $query = $agreement->messages()
            ->with(['sender', 'media'])
            ->when($before !== null, fn ($messages) => $messages->where('id', '<', $before))
            ->orderByDesc('id')
            ->limit(51)
            ->get();
        $hasOlder = $query->count() > 50;
        $messages = $query->take(50)->reverse()->values();
        $participants = $this->participants($agreement);
        $canSend = $this->canSend($request->user(), $agreement);

        return [
            'agreement_id' => $agreement->id,
            'participants' => $participants->map(fn (User $user): array => $this->publicUser($user))->values(),
            'messages' => GigMessageResource::collection($messages)->resolve($request),
            'has_older' => $hasOlder,
            'oldest_id' => $messages->first()?->id,
            'capabilities' => [
                'canViewConversation' => true,
                'canSendMessage' => $canSend,
                'canViewMedia' => true,
                'canMarkRead' => $canSend,
                'isReadOnly' => ! $canSend,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $snapshot
     */
    public function record(
        GigAgreement $agreement,
        GigWorkflowEvent $event,
        string $eventKey,
        array $snapshot = [],
    ): GigMessage {
        $existing = GigMessage::query()
            ->where('gig_agreement_id', $agreement->id)
            ->where('event_key', $eventKey)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            $message = new GigMessage([
                'kind' => GigMessageKind::System,
                'workflow_event' => $event,
                'event_key' => $eventKey,
                'event_snapshot' => $snapshot,
            ]);
            $message->agreement()->associate($agreement);
            $message->save();

            broadcast(new GigMessageCreated($message));

            return $message;
        } catch (QueryException $exception) {
            if (! in_array((string) $exception->getCode(), ['19', '23000'], true)) {
                throw $exception;
            }

            return GigMessage::query()
                ->where('gig_agreement_id', $agreement->id)
                ->where('event_key', $eventKey)
                ->firstOrFail();
        }
    }

    public function markRead(User $user, GigAgreement $agreement): int
    {
        abort_unless(! $user->activeBan()->exists() && $this->canView($user, $agreement), 403);

        $updated = GigMessage::query()
            ->where('gig_agreement_id', $agreement->id)
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if ($updated > 0) {
            broadcast(new GigMessagesRead($agreement, $user->id));
        }

        return $updated;
    }

    public function destination(GigAgreement $agreement): string
    {
        $agreement->loadMissing(['gig.dispute']);
        $gig = $agreement->gig;

        $route = match ($gig->status) {
            GigStatus::AgreementPreparation, GigStatus::LockPending => route('app.gigs.agreement.show', $gig),
            GigStatus::PaymentPending => route('app.gigs.payment.show', $gig),
            GigStatus::Locked, GigStatus::InProgress, GigStatus::Review => route('app.gigs.workflow.show', $gig),
            GigStatus::Disputed => route('app.gig_disputes.show', $gig->dispute),
            GigStatus::Completed, GigStatus::Cancelled, GigStatus::DisputeResolved => route('app.history.show', $gig),
            default => route('app.home'),
        };

        return $route;
    }

    private function isLatestAgreement(GigAgreement $agreement): bool
    {
        return $agreement->gig->agreements()->latest('id')->value('id') === $agreement->id;
    }

    /**
     * @return array{id: int, name: string, avatar_url: ?string}
     */
    private function publicUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar_url' => $user->avatar_url,
        ];
    }
}
