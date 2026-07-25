<?php

namespace App\Actions;

use App\Enums\GigOfferStatus;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\GigRating;
use App\Models\User;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class SubmitGigRating
{
    public function __construct(private NotificationService $notifications) {}

    public function execute(User $rater, Gig $gig, int $score, ?string $comment): GigRating
    {
        if ($score < 1 || $score > 5 || ($comment !== null && mb_strlen($comment) > 1000)) {
            throw new DomainException('Rating tidak valid.');
        }

        $persistedGig = Gig::query()->findOrFail($gig->id, ['id', 'client_id']);
        $persistedOffer = GigOffer::query()
            ->forGig($persistedGig->id)
            ->accepted()
            ->orderBy('id')
            ->first(['id', 'gig_id', 'freelancer_id']);

        if ($persistedOffer === null) {
            throw new DomainException('Gig tidak memiliki freelancer terpilih.');
        }

        try {
            $rating = DB::transaction(function () use ($rater, $persistedGig, $persistedOffer, $score, $comment): GigRating {
                $participantIds = [$persistedGig->client_id, $persistedOffer->freelancer_id];
                sort($participantIds);

                $participants = User::query()
                    ->whereKey($participantIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $lockedGig = Gig::query()->lockForUpdate()->findOrFail($persistedGig->id);
                $acceptedOffers = GigOffer::query()
                    ->whereKey([$persistedOffer->id])
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();
                $lockedOffer = $acceptedOffers->first();

                $existingRatings = GigRating::query()
                    ->where('gig_id', $lockedGig->id)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                if (! $lockedGig->status->isTerminal()) {
                    throw new DomainException('Gig belum berada pada status terminal.');
                }

                if ($lockedOffer === null
                    || $lockedOffer->gig_id !== $lockedGig->id
                    || $lockedOffer->freelancer_id !== $persistedOffer->freelancer_id
                    || $lockedOffer->status !== GigOfferStatus::ACCEPTED) {
                    throw new DomainException('Freelancer terpilih telah berubah.');
                }

                if ($lockedGig->client_id === $lockedOffer->freelancer_id) {
                    throw new DomainException('Peserta gig tidak valid.');
                }

                if (! in_array($rater->id, [$lockedGig->client_id, $lockedOffer->freelancer_id], true)
                    || ! $participants->has($rater->id)) {
                    throw new AuthorizationException('Anda bukan peserta gig ini.');
                }

                $lockedRater = $participants->get($rater->id);
                $hasParticipantRole = $rater->id === $lockedGig->client_id
                    ? $lockedRater->role === UserRole::Client
                    : $lockedRater->role === UserRole::Freelancer;
                if (! $hasParticipantRole) {
                    throw new AuthorizationException('Peran peserta gig tidak valid.');
                }

                if ($lockedRater->activeBan()->exists()) {
                    throw new AuthorizationException('Akun yang ditangguhkan tidak dapat memberi rating.');
                }

                if ($existingRatings->contains('rater_id', $rater->id)) {
                    throw new DomainException('Anda sudah memberi rating untuk gig ini.');
                }

                $recipientId = $rater->id === $lockedGig->client_id
                    ? $lockedOffer->freelancer_id
                    : $lockedGig->client_id;

                $rating = new GigRating([
                    'score' => $score,
                    'comment' => $comment,
                ]);
                $rating->gig()->associate($lockedGig);
                $rating->rater()->associate($lockedRater);
                $rating->recipient()->associate($participants->get($recipientId));
                $rating->save();

                return $rating->refresh();
            }, attempts: 3);
        } catch (QueryException $exception) {
            if (in_array((string) $exception->getCode(), ['19', '23000'], true)) {
                throw new DomainException('Anda sudah memberi rating untuk gig ini.', previous: $exception);
            }

            throw $exception;
        }

        try {
            $this->notifications->send(
                'Rating gig baru',
                NotificationTargetType::User,
                $rating->rater_id,
                "Anda menerima rating {$rating->score} bintang untuk gig {$gig->title}.",
                [$rating->recipient_id],
                action_url: route('app.history.show', $gig),
                action_label: 'Lihat riwayat gig',
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        return $rating;
    }
}
