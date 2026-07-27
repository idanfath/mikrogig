<?php

namespace App\Actions;

use App\Enums\GigMessageKind;
use App\Enums\NotificationTargetType;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigMessage;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\GigConversationService;
use App\Services\GigPrivateImageService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Throwable;

class SendGigMessage
{
    public function __construct(
        private GigPrivateImageService $images,
        private GigConversationService $conversations,
        private NotificationService $notifications,
    ) {}

    /**
     * @param  array<int, mixed>  $images
     */
    public function execute(
        User $sender,
        GigAgreement $agreement,
        ?string $body,
        array $images,
    ): GigMessage {
        $body = $body === null ? null : trim($body);
        if (($body === null || $body === '') && $images === []) {
            throw new DomainException('Pesan atau gambar wajib diisi.');
        }

        if ($body !== null && mb_strlen($body) > 2000) {
            throw new DomainException('Pesan maksimal 2.000 karakter.');
        }

        $persisted = GigAgreement::query()
            ->with(['gig', 'acceptedOffer'])
            ->findOrFail($agreement->getKey());
        $stored = $this->images->store($images, 'gig-messages', 'Gig conversation image', 0);
        $paths = array_column($stored, 'path');

        try {
            [$message, $recipient] = DB::transaction(function () use ($sender, $persisted, $body, $stored): array {
                $participantIds = [$persisted->gig->client_id, $persisted->acceptedOffer->freelancer_id];
                sort($participantIds);
                User::query()->whereKey($participantIds)->orderBy('id')->lockForUpdate()->get();

                $gig = Gig::query()->lockForUpdate()->findOrFail($persisted->gig_id);
                $lockedAgreement = GigAgreement::query()->lockForUpdate()->findOrFail($persisted->id);
                $offer = GigOffer::query()
                    ->whereKey($persisted->gig_offer_id)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedAgreement->gig_id !== $persisted->gig_id
                    || $lockedAgreement->gig_offer_id !== $persisted->gig_offer_id
                    || $offer->gig_id !== $gig->id) {
                    throw new DomainException('Asosiasi percakapan telah berubah.');
                }

                if (! in_array($sender->id, [$gig->client_id, $offer->freelancer_id], true)) {
                    throw new AuthorizationException;
                }

                $recipientId = $sender->id === $gig->client_id ? $offer->freelancer_id : $gig->client_id;
                $isCurrent = $gig->currentAgreement()->whereKey($lockedAgreement->id)->exists();
                if (! $isCurrent
                    || $lockedAgreement->closed_at !== null
                    || ! $this->conversations->isWritableStatus($gig->status)
                    || $sender->activeBan()->exists()
                ) {
                    throw new DomainException('Percakapan ini tidak lagi dapat menerima pesan.');
                }

                $message = new GigMessage([
                    'kind' => GigMessageKind::User,
                    'body' => $body,
                ]);
                $message->agreement()->associate($lockedAgreement);
                $message->sender()->associate($sender->id);
                $message->recipient()->associate($recipientId);
                $message->save();

                foreach ($stored as $order => $image) {
                    $message->media()->create([
                        'path' => $image['path'],
                        'mime_type' => $image['mime_type'],
                        'display_order' => $order,
                    ]);
                }

                return [$message->load(['sender', 'media', 'agreement']), User::query()->findOrFail($recipientId)];
            }, attempts: 3);
        } catch (Throwable $exception) {
            $this->images->delete($paths);

            throw $exception;
        }

        try {
            $this->notifications->send(
                title: "Pesan Baru dari {$sender->name}",
                targetType: NotificationTargetType::User,
                createdBy: $sender->id,
                body: "{$sender->name} mengirimkan pesan baru pada workflow gig \"{$persisted->gig->title}\".",
                recipientIds: [$recipient->id],
                action_url: route('app.gig_conversations.show', $persisted),
                action_label: 'Buka Percakapan',
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $message->refresh()->load(['sender', 'media', 'agreement']);
    }
}
