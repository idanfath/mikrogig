<?php

namespace App\Services;

use App\Enums\GigDisputeStatus;
use App\Enums\GigExitStatus;
use App\Enums\GigFinishRequestStatus;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigDispute;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class HomeService
{
    private const APPLICATION_LIMIT = 3;

    private CarbonImmutable $now;

    /**
     * @return array<string, mixed>
     */
    public function for(User $user): array
    {
        $now = CarbonImmutable::now(config('app.timezone'));
        $this->now = $now;
        $ban = $user->activeBan()->with('gigOffense.gig')->first();

        if ($ban !== null && $user->role !== UserRole::Admin) {
            return [
                'account_state' => 'suspended',
                'viewer_name' => $user->name,
                'role' => $user->role->value,
                'server_now' => $now->toISOString(),
                'suspension' => [
                    'reason' => $ban->reason ?? 'Akun ditangguhkan karena pelanggaran kebijakan platform.',
                    'banned_at' => $ban->banned_at->toISOString(),
                    'banned_until' => $ban->banned_until?->toISOString(),
                    'is_permanent' => $ban->banned_until === null,
                    'gig_title' => $ban->gigOffense?->gig?->title,
                ],
            ];
        }

        return match ($user->role) {
            UserRole::Client => $this->client($user, $now),
            UserRole::Freelancer => $this->freelancer($user, $now),
            UserRole::Admin => $this->admin($user, $now),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function client(User $user, CarbonImmutable $now): array
    {
        $nonterminal = $this->nonterminalStatuses();
        $pendingRatings = Gig::query()
            ->forClient($user)
            ->terminal()
            ->whereHas('acceptedOffer')
            ->whereDoesntHave('ratings', fn ($query) => $query->where('rater_id', $user->id))
            ->count();

        $gigs = Gig::query()
            ->forClient($user)
            ->whereIn('status', $nonterminal)
            ->with([
                'acceptedOffer',
                'currentAgreement.payment',
                'latestFinishRequest',
                'dispute',
                'exitRequests' => fn ($query) => $query->latest('id'),
            ])
            ->withCount(['offers as pending_offers_count' => fn ($query) => $query->pending()])
            ->orderByDesc('updated_at')
            ->limit(30)
            ->get();

        $actions = collect();
        foreach ($gigs as $gig) {
            $agreement = $gig->currentAgreement;
            $payment = $agreement?->payment;
            $finishRequest = $gig->latestFinishRequest;
            $pendingExit = $gig->exitRequests->firstWhere('status', GigExitStatus::Pending);

            if ($gig->status === GigStatus::Open && $gig->pending_offers_count > 0) {
                $actions->push($this->action(
                    "applicants:{$gig->id}",
                    'applicants',
                    "{$gig->pending_offers_count} pelamar menunggu",
                    'Bandingkan penawaran sebelum menentukan pekerja.',
                    $gig,
                    null,
                    'Lihat pelamar',
                    'applicants',
                ));
            } elseif ($gig->status === GigStatus::AgreementPreparation) {
                $actions->push($this->action(
                    "agreement:{$gig->id}",
                    'agreement',
                    'Lengkapi kesepakatan kerja',
                    'Tetapkan ruang lingkup, jadwal, dan harga akhir.',
                    $gig,
                    null,
                    'Buka kesepakatan',
                    'agreement',
                ));
            } elseif ($gig->status === GigStatus::PaymentPending && $payment?->status === GigPaymentStatus::Pending) {
                $actions->push($this->action(
                    "payment:{$gig->id}",
                    'payment',
                    'Selesaikan pembayaran',
                    'Pembayaran perlu diselesaikan agar pekerjaan dapat dikunci.',
                    $gig,
                    $payment->expires_at,
                    'Bayar sekarang',
                    'payment',
                ));
            } elseif ($gig->status === GigStatus::Locked && $payment?->status === GigPaymentStatus::Paid && $agreement?->freelancer_confirmed_at !== null) {
                $actions->push($this->action(
                    "start:{$gig->id}",
                    'work_start',
                    'Pekerjaan siap dimulai',
                    'Konfirmasi mulai ketika pekerja telah siap.',
                    $gig,
                    $this->startsAt($gig),
                    'Buka alur kerja',
                    'workflow',
                ));
            } elseif ($gig->status === GigStatus::Review && $finishRequest?->status === GigFinishRequestStatus::Pending) {
                $actions->push($this->action(
                    "review:{$gig->id}",
                    'finish_review',
                    'Tinjau permintaan penyelesaian',
                    'Periksa hasil pekerjaan sebelum batas tinjauan.',
                    $gig,
                    $finishRequest->review_due_at,
                    'Tinjau hasil',
                    'workflow',
                ));
            }

            if ($pendingExit?->responder_id === $user->id) {
                $actions->push($this->action(
                    "exit:{$pendingExit->id}",
                    'exit_request',
                    'Tanggapi permintaan keluar',
                    'Pekerja menunggu keputusan Anda.',
                    $gig,
                    null,
                    'Tinjau permintaan',
                    'workflow',
                ));
            }

            if ($gig->dispute?->status === GigDisputeStatus::AwaitingCounterproof
                && $gig->dispute->respondent_id === $user->id) {
                $actions->push($this->action(
                    "counterproof:{$gig->dispute->id}",
                    'counterproof',
                    'Kirim counterproof sengketa',
                    'Tanggapi bukti pihak lain sebelum tenggat.',
                    $gig,
                    $gig->dispute->counterproof_due_at,
                    'Buka sengketa',
                    'dispute',
                    $gig->dispute->id,
                ));
            }
        }

        $ratingReminders = Gig::query()
            ->forClient($user)
            ->terminal()
            ->whereHas('acceptedOffer')
            ->whereDoesntHave('ratings', fn ($query) => $query->where('rater_id', $user->id))
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->map(fn (Gig $gig): array => $this->action(
                "rating:{$gig->id}",
                'rating',
                'Beri penilaian',
                'Bagikan pengalaman Anda setelah gig selesai.',
                $gig,
                null,
                'Beri rating',
                'history',
            ));

        return $this->activeBase($user, $now, [
            'held_amount' => GigPayment::query()
                ->where('status', GigPaymentStatus::Paid)
                ->whereHas('gig', fn ($query) => $query
                    ->forClient($user)
                    ->whereIn('status', $nonterminal))
                ->sum('amount'),
            'active_gigs' => Gig::query()->forClient($user)->whereIn('status', $nonterminal)->count(),
            'new_applicants' => GigOffer::query()
                ->pending()
                ->whereHas('gig', fn ($query) => $query->forClient($user)->open())
                ->count(),
            'pending_ratings' => $pendingRatings,
        ], $actions, $ratingReminders);
    }

    /**
     * @return array<string, mixed>
     */
    private function freelancer(User $user, CarbonImmutable $now): array
    {
        $acceptedOffers = GigOffer::query()
            ->forFreelancer($user->id)
            ->where('status', GigOfferStatus::ACCEPTED)
            ->whereHas('gig', fn ($query) => $query->whereIn('status', $this->nonterminalStatuses()))
            ->with([
                'gig.currentAgreement',
                'gig.latestFinishRequest',
                'gig.dispute',
                'gig.exitRequests' => fn ($query) => $query->latest('id'),
            ])
            ->latest('updated_at')
            ->limit(10)
            ->get();
        $actions = collect();

        foreach ($acceptedOffers as $offer) {
            $gig = $offer->gig;
            $agreement = $gig->currentAgreement;
            $pendingExit = $gig->exitRequests->firstWhere('status', GigExitStatus::Pending);

            if ($gig->status === GigStatus::LockPending && $agreement?->freelancer_confirmed_at === null) {
                $actions->push($this->action(
                    "terms:{$gig->id}",
                    'final_terms',
                    'Konfirmasi syarat akhir',
                    'Periksa ruang lingkup, jadwal, dan harga sebelum menyetujui.',
                    $gig,
                    null,
                    'Tinjau syarat',
                    'agreement',
                ));
            } elseif ($gig->status === GigStatus::Locked) {
                $actions->push($this->action(
                    "schedule:{$gig->id}",
                    'work_start',
                    'Pekerjaan telah dijadwalkan',
                    'Pastikan Anda siap pada waktu yang disepakati.',
                    $gig,
                    $this->startsAt($gig),
                    'Buka alur kerja',
                    'workflow',
                ));
            } elseif ($gig->status === GigStatus::InProgress) {
                $actions->push($this->action(
                    "finish:{$gig->id}",
                    'finish_request',
                    'Selesaikan pekerjaan',
                    'Kirim hasil dan bukti setelah pekerjaan selesai.',
                    $gig,
                    null,
                    'Kirim hasil',
                    'workflow',
                ));
            }

            if ($pendingExit?->responder_id === $user->id) {
                $actions->push($this->action(
                    "exit:{$pendingExit->id}",
                    'exit_request',
                    'Tanggapi permintaan keluar',
                    'Klien menunggu keputusan Anda.',
                    $gig,
                    null,
                    'Tinjau permintaan',
                    'workflow',
                ));
            }

            if ($gig->dispute?->status === GigDisputeStatus::AwaitingCounterproof
                && $gig->dispute->respondent_id === $user->id) {
                $actions->push($this->action(
                    "counterproof:{$gig->dispute->id}",
                    'counterproof',
                    'Kirim counterproof sengketa',
                    'Tanggapi bukti pihak lain sebelum tenggat.',
                    $gig,
                    $gig->dispute->counterproof_due_at,
                    'Buka sengketa',
                    'dispute',
                    $gig->dispute->id,
                ));
            }
        }

        $exclusiveGig = $acceptedOffers->first()?->gig;

        return [
            ...$this->activeBase($user, $now, [
                'active_applications' => GigOffer::query()
                    ->forFreelancer($user->id)
                    ->pending()
                    ->count(),
                'application_limit' => self::APPLICATION_LIMIT,
                'completed_gigs' => GigOffer::query()
                    ->forFreelancer($user->id)
                    ->where('status', GigOfferStatus::ACCEPTED)
                    ->whereHas('gig', fn ($query) => $query->where('status', GigStatus::Completed))
                    ->count(),
            ], $actions),
            'exclusive_gig' => $exclusiveGig === null ? null : [
                'id' => $exclusiveGig->id,
                'title' => $exclusiveGig->title,
                'status' => $exclusiveGig->status->value,
                'starts_at' => $this->startsAt($exclusiveGig)?->toISOString(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function admin(User $user, CarbonImmutable $now): array
    {
        $disputes = GigDispute::query()
            ->whereIn('status', [GigDisputeStatus::AwaitingCounterproof, GigDisputeStatus::AwaitingAdmin])
            ->with('gig')
            ->orderBy('counterproof_due_at')
            ->limit(30)
            ->get();
        $actions = $disputes->map(fn (GigDispute $dispute): array => $this->action(
            "dispute:{$dispute->id}",
            $dispute->status === GigDisputeStatus::AwaitingAdmin ? 'dispute_decision' : 'counterproof',
            $dispute->status === GigDisputeStatus::AwaitingAdmin
                ? 'Sengketa menunggu keputusan'
                : 'Counterproof pihak terkait ditunggu',
            $dispute->status === GigDisputeStatus::AwaitingAdmin
                ? 'Tinjau bukti kedua pihak dan tetapkan keputusan.'
                : 'Pantau tenggat counterproof sebelum proses otomatis.',
            $dispute->gig,
            $dispute->status === GigDisputeStatus::AwaitingCounterproof
                ? $dispute->counterproof_due_at
                : null,
            'Buka sengketa',
            'admin_dispute',
            $dispute->id,
        ));

        return $this->activeBase($user, $now, [
            'awaiting_admin' => GigDispute::query()->awaitingAdmin()->count(),
            'awaiting_counterproof' => GigDispute::query()->awaitingCounterproof()->count(),
            'expiring_today' => GigDispute::query()
                ->awaitingCounterproof()
                ->whereBetween('counterproof_due_at', [$now->startOfDay(), $now->endOfDay()])
                ->count(),
        ], $actions);
    }

    /**
     * @param  array<string, int>  $summary
     * @param  Collection<int, array<string, mixed>>  $actions
     * @param  Collection<int, array<string, mixed>>|null  $ratingReminders
     * @return array<string, mixed>
     */
    private function activeBase(
        User $user,
        CarbonImmutable $now,
        array $summary,
        Collection $actions,
        ?Collection $ratingReminders = null,
    ): array {
        return [
            'account_state' => 'active',
            'viewer_name' => $user->name,
            'role' => $user->role->value,
            'server_now' => $now->toISOString(),
            'summary' => $summary,
            'actions' => $actions
                ->sortBy([
                    fn (array $action): int => match ($action['priority']) {
                        'critical' => 0,
                        'warning' => 1,
                        default => 2,
                    },
                    fn (array $action): string => $action['due_at'] ?? '9999-12-31T23:59:59Z',
                    fn (array $action): string => $action['id'],
                ])
                ->take(6)
                ->values()
                ->all(),
            'rating_reminders' => $ratingReminders?->values()->all() ?? [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function action(
        string $id,
        string $kind,
        string $title,
        string $description,
        Gig $gig,
        mixed $dueAt,
        string $label,
        string $targetType,
        ?int $targetId = null,
    ): array {
        $due = $dueAt === null ? null : CarbonImmutable::parse($dueAt);
        $secondsUntilDue = $due?->diffInSeconds($this->now, false);
        $priority = match (true) {
            $secondsUntilDue !== null && $secondsUntilDue >= -3600 => 'critical',
            $secondsUntilDue !== null && $secondsUntilDue >= -86400 => 'warning',
            default => 'normal',
        };

        return [
            'id' => $id,
            'kind' => $kind,
            'priority' => $priority,
            'title' => $title,
            'description' => $description,
            'gig_title' => $gig->title,
            'due_at' => $due?->toISOString(),
            'action_label' => $label,
            'target' => [
                'type' => $targetType,
                'id' => $targetId ?? $gig->id,
            ],
        ];
    }

    /**
     * @return array<int, GigStatus>
     */
    private function nonterminalStatuses(): array
    {
        return array_values(array_filter(
            GigStatus::cases(),
            fn (GigStatus $status): bool => ! $status->isTerminal(),
        ));
    }

    private function startsAt(Gig $gig): ?CarbonImmutable
    {
        if ($gig->work_date === null || $gig->start_time === null) {
            return null;
        }

        return CarbonImmutable::parse(
            $gig->work_date->format('Y-m-d').' '.$gig->start_time,
            config('app.timezone'),
        );
    }
}
