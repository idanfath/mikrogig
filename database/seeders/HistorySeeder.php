<?php

namespace Database\Seeders;

use App\Enums\GigAgreementClosureReason;
use App\Enums\GigCategory;
use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeSubmissionType;
use App\Enums\GigDisputeType;
use App\Enums\GigFinishRequestStatus;
use App\Enums\GigMessageKind;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\GigWorkflowEvent;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigDispute;
use App\Models\GigDisputeSubmission;
use App\Models\GigFinishRequest;
use App\Models\GigMessage;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\GigRating;
use App\Models\GigSettlement;
use App\Models\User;
use App\Models\UserBan;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HistorySeeder extends Seeder
{
    public function run(): void
    {
        $completed = [
            [
                'title' => 'Bongkar dan Tata Stok Sembako',
                'description' => 'Membantu menurunkan karung dan kardus dari mobil bak, lalu menatanya di gudang belakang toko.',
                'category' => GigCategory::Labor,
                'client' => 'client@example.com',
                'freelancer' => 'dummy.freelancer3@example.com',
                'fee' => 325_000,
                'months_ago' => 6,
                'image' => 1,
                'ratings' => ['Kerja cepat dan penataan barangnya rapi.', 'Instruksi jelas dan pembayaran sesuai kesepakatan.'],
            ],
            [
                'title' => 'Bersihkan Rumah Setelah Renovasi',
                'description' => 'Membersihkan debu renovasi pada lantai, jendela, dan dua kamar sebelum rumah ditempati.',
                'category' => GigCategory::Cleaning,
                'client' => 'dummy.client1@example.com',
                'freelancer' => 'dummy.freelancer2@example.com',
                'fee' => 280_000,
                'months_ago' => 5,
                'image' => 3,
                'ratings' => ['Hasil bersih dan selesai sesuai waktu.', 'Peralatan sudah disiapkan dan ruang lingkupnya jelas.'],
            ],
            [
                'title' => 'Pindahkan Perabot Kamar Kos',
                'description' => 'Memindahkan meja, rak kecil, kasur, dan kardus ke kamar kos baru yang masih satu kecamatan.',
                'category' => GigCategory::Moving,
                'client' => 'dummy.client2@example.com',
                'freelancer' => 'freelancer@example.com',
                'fee' => 450_000,
                'months_ago' => 4,
                'image' => 2,
                'ratings' => ['Barang dipindahkan dengan hati-hati dan tidak ada kerusakan.', 'Klien membantu memastikan akses lokasi lancar.'],
            ],
            [
                'title' => 'Perbaiki Keramik Teras Rumah',
                'description' => 'Mengganti enam keramik teras yang pecah dan merapikan nat agar aman dilewati.',
                'category' => GigCategory::Construction,
                'client' => 'dummy.client3@example.com',
                'freelancer' => 'dummy.freelancer1@example.com',
                'fee' => 600_000,
                'months_ago' => 3,
                'image' => 2,
                'ratings' => ['Keramik terpasang rapi dan area dibersihkan kembali.', 'Material tersedia lengkap dan keputusan cepat.'],
            ],
            [
                'title' => 'Jaga Area Parkir Acara Warga',
                'description' => 'Menjaga alur keluar masuk dan membantu menata parkir sepeda motor selama acara malam.',
                'category' => GigCategory::Security,
                'client' => 'client@example.com',
                'freelancer' => 'dummy.freelancer1@example.com',
                'fee' => 350_000,
                'months_ago' => 2,
                'image' => 3,
                'ratings' => ['Area parkir tertib sampai acara selesai.', 'Koordinator mudah dihubungi dan jadwal tepat.'],
            ],
        ];

        foreach ($completed as $definition) {
            $this->createCompletedGig($definition);
        }

        $this->createCancelledGig(
            title: 'Bersihkan Gudang Sebelum Renovasi',
            description: 'Membersihkan gudang dan memindahkan barang ringan sebelum pekerjaan renovasi dimulai.',
            category: GigCategory::Cleaning,
            clientEmail: 'dummy.client1@example.com',
            freelancerEmail: 'dummy.freelancer2@example.com',
            fee: 240_000,
            monthsAgo: 4,
            image: 2,
            paymentStatus: GigPaymentStatus::Expired,
        );
        $this->createCancelledGig(
            title: 'Pindahkan Meja Toko ke Gudang',
            description: 'Memindahkan meja pajangan dan beberapa kardus dari toko menuju gudang di belakang bangunan.',
            category: GigCategory::Moving,
            clientEmail: 'dummy.client2@example.com',
            freelancerEmail: 'dummy.freelancer3@example.com',
            fee: 300_000,
            monthsAgo: 3,
            image: 4,
            paymentStatus: GigPaymentStatus::Cancelled,
        );
        $this->createResolvedDispute();
    }

    /**
     * @param  array{title: string, description: string, category: GigCategory, client: string, freelancer: string, fee: int, months_ago: int, image: int, ratings: array{string, string}}  $definition
     */
    private function createCompletedGig(array $definition): void
    {
        if ($this->gigExists($definition['title'], $definition['client'])) {
            return;
        }

        DB::transaction(function () use ($definition): void {
            $at = CarbonImmutable::now()->startOfDay()->subMonths($definition['months_ago'])->setTime(8, 0);
            [$gig, $agreement, $payment, $client, $freelancer] = $this->createWorkflow(
                title: $definition['title'],
                description: $definition['description'],
                category: $definition['category'],
                clientEmail: $definition['client'],
                freelancerEmail: $definition['freelancer'],
                fee: $definition['fee'],
                at: $at,
                image: $definition['image'],
                status: GigStatus::Completed,
            );

            $gig->started_at = $at->addHour();
            $gig->completed_at = $at->addHours(6);
            $gig->save();

            $finish = new GigFinishRequest([
                'completion_note' => $this->completionNote($definition['category']),
                'review_due_at' => $at->addDay(),
                'accepted_at' => $at->addHours(6),
            ]);
            $finish->gig()->associate($gig);
            $finish->payment()->associate($payment);
            $finish->freelancer()->associate($freelancer);
            $finish->reviewer()->associate($client);
            $finish->status = GigFinishRequestStatus::Accepted;
            $this->saveAt($finish, $at->addHours(5));
            $finish->media()->create([
                'path' => "database/seeders/assets/completions/{$definition['category']->value}.webp",
            ]);

            $this->rating($gig, $client, $freelancer, 5, $definition['ratings'][0], $at->addDay());
            $this->rating($gig, $freelancer, $client, 5, $definition['ratings'][1], $at->addDay()->addHour());
            $this->seedConversation($agreement, $client, $freelancer, $at, true);
        }, attempts: 3);
    }

    private function createCancelledGig(
        string $title,
        string $description,
        GigCategory $category,
        string $clientEmail,
        string $freelancerEmail,
        int $fee,
        int $monthsAgo,
        int $image,
        GigPaymentStatus $paymentStatus,
    ): void {
        if ($this->gigExists($title, $clientEmail)) {
            return;
        }

        DB::transaction(function () use ($title, $description, $category, $clientEmail, $freelancerEmail, $fee, $monthsAgo, $image, $paymentStatus): void {
            $at = CarbonImmutable::now()->startOfDay()->subMonths($monthsAgo)->setTime(9, 0);
            [$gig, $agreement, , $client, $freelancer] = $this->createWorkflow(
                title: $title,
                description: $description,
                category: $category,
                clientEmail: $clientEmail,
                freelancerEmail: $freelancerEmail,
                fee: $fee,
                at: $at,
                image: $image,
                status: GigStatus::Cancelled,
                paymentStatus: $paymentStatus,
            );

            $gig->cancelled_at = $at->addHours(2);
            $gig->save();
            $agreement->closed_at = $at->addHours(2);
            $agreement->closure_reason = GigAgreementClosureReason::GigCancelled;
            $agreement->save();
            $this->seedConversation($agreement, $client, $freelancer, $at, false);

            $event = $paymentStatus === GigPaymentStatus::Expired
                ? GigWorkflowEvent::PaymentExpired
                : GigWorkflowEvent::PaymentCancelled;
            $this->systemMessage($agreement, $event, "seed:{$gig->id}:payment-terminal", $at->addHours(2));
            $this->systemMessage($agreement, GigWorkflowEvent::GigCancelled, "seed:{$gig->id}:cancelled", $at->addHours(2)->addMinute());
        }, attempts: 3);
    }

    private function createResolvedDispute(): void
    {
        $title = 'Pasang dan Rapikan Keramik Teras Kios';
        $clientEmail = 'dummy.client3@example.com';
        if ($this->gigExists($title, $clientEmail)) {
            return;
        }

        DB::transaction(function () use ($title, $clientEmail): void {
            $at = CarbonImmutable::now()->startOfDay()->subMonth()->setTime(8, 0);
            [$gig, $agreement, $payment, $client, $freelancer] = $this->createWorkflow(
                title: $title,
                description: 'Memasang keramik teras kios, merapikan nat, dan memastikan permukaan aman dilewati pelanggan.',
                category: GigCategory::Construction,
                clientEmail: $clientEmail,
                freelancerEmail: 'dummy.freelancer1@example.com',
                fee: 750_000,
                at: $at,
                image: 2,
                status: GigStatus::DisputeResolved,
            );
            $gig->started_at = $at->addHour();
            $gig->save();

            $finish = new GigFinishRequest([
                'completion_note' => 'Pemasangan keramik teras dan perapian nat telah diselesaikan sesuai lingkup kerja.',
                'review_due_at' => $at->addDay(),
                'rejected_at' => $at->addHours(7),
                'rejection_reason' => 'Klien menilai beberapa keramik dan nat masih belum rata.',
            ]);
            $finish->gig()->associate($gig);
            $finish->payment()->associate($payment);
            $finish->freelancer()->associate($freelancer);
            $finish->reviewer()->associate($client);
            $finish->status = GigFinishRequestStatus::Rejected;
            $this->saveAt($finish, $at->addHours(6));
            $finish->media()->create(['path' => 'database/seeders/assets/completions/construction.webp']);

            $dispute = new GigDispute([
                'type' => GigDisputeType::FinishRejected,
                'opened_at' => $at->addHours(8),
                'counterproof_due_at' => $at->addDay(),
                'finding' => GigDisputeFinding::ClientAtFault,
                'resolution_note' => 'Bukti menunjukkan pemasangan utama telah selesai. Kekurangan minor pada nat tidak membenarkan penahanan seluruh pembayaran.',
                'resolved_at' => $at->addDays(2),
            ]);
            $dispute->gig()->associate($gig);
            $dispute->agreement()->associate($agreement);
            $dispute->payment()->associate($payment);
            $dispute->finishRequest()->associate($finish);
            $dispute->reporter()->associate($freelancer);
            $dispute->respondent()->associate($client);
            $dispute->resolver()->associate(User::query()->where('email', 'admin@example.com')->firstOrFail());
            $dispute->status = GigDisputeStatus::Resolved;
            $this->saveAt($dispute, $at->addHours(8));

            $report = $this->submission(
                $dispute,
                $freelancer,
                GigDisputeSubmissionType::Report,
                'Keramik sudah terpasang dan bukti hasil telah dikirim, tetapi seluruh hasil ditolak tanpa kesempatan merapikan bagian nat yang dipersoalkan.',
                $at->addHours(8),
            );
            $report->media()->create(['path' => 'database/seeders/assets/completions/construction.webp']);
            $counterproof = $this->submission(
                $dispute,
                $client,
                GigDisputeSubmissionType::Counterproof,
                'Saya melihat beberapa keramik masih dalam proses pemasangan dan meminta hasil diperiksa sebelum pembayaran dilepas.',
                $at->addHours(12),
            );
            $counterproof->media()->create(['path' => 'database/seeders/assets/gigs/construction/02.webp']);

            $settlement = new GigSettlement([
                'total_amount' => $payment->amount,
                'freelancer_payout' => $payment->amount,
                'client_refund' => 0,
                'outcome' => GigSettlementOutcome::FullFreelancerPayout,
                'recorded_at' => $at->addDays(2),
            ]);
            $settlement->gig()->associate($gig);
            $settlement->payment()->associate($payment);
            $settlement->dispute()->associate($dispute);
            $settlement->finishRequest()->associate($finish);
            $this->saveAt($settlement, $at->addDays(2));

            $ban = UserBan::query()->create([
                'user_id' => $client->id,
                'banned_by' => null,
                'reason' => 'Pelanggaran pertama terkait penahanan pembayaran gig.',
                'banned_at' => $at->addDays(2),
                'banned_until' => $at->addDays(5),
                'unbanned_at' => null,
                'unbanned_by' => null,
            ]);
            $offense = $client->gigOffenses()->make(['sequence' => 1, 'duration_days' => 3]);
            $offense->gig()->associate($gig);
            $offense->dispute()->associate($dispute);
            $offense->ban()->associate($ban);
            $this->saveAt($offense, $at->addDays(2));

            $this->rating($gig, $client, $freelancer, 4, 'Pekerjaan utama selesai, walau komunikasi akhir sempat tidak lancar.', $at->addDays(3));
            $this->rating($gig, $freelancer, $client, 3, 'Ruang lingkup jelas, tetapi penyelesaian pembayaran perlu dibantu admin.', $at->addDays(3)->addHour());
            $this->seedConversation($agreement, $client, $freelancer, $at, false);
            $this->systemMessage($agreement, GigWorkflowEvent::FinishSubmitted, "seed:{$gig->id}:finish", $at->addHours(6));
            $this->systemMessage($agreement, GigWorkflowEvent::FinishRejected, "seed:{$gig->id}:finish-rejected", $at->addHours(7));
            $this->systemMessage($agreement, GigWorkflowEvent::DisputeOpened, "seed:{$gig->id}:dispute", $at->addHours(8));
            $this->systemMessage($agreement, GigWorkflowEvent::CounterproofSubmitted, "seed:{$gig->id}:counterproof", $at->addHours(12));
            $this->systemMessage($agreement, GigWorkflowEvent::DisputeResolved, "seed:{$gig->id}:resolved", $at->addDays(2));
        }, attempts: 3);
    }

    /**
     * @return array{Gig, GigAgreement, GigPayment, User, User}
     */
    private function createWorkflow(
        string $title,
        string $description,
        GigCategory $category,
        string $clientEmail,
        string $freelancerEmail,
        int $fee,
        CarbonImmutable $at,
        int $image,
        GigStatus $status,
        GigPaymentStatus $paymentStatus = GigPaymentStatus::Paid,
    ): array {
        $client = User::query()->where('email', $clientEmail)->firstOrFail();
        $freelancer = User::query()->where('email', $freelancerEmail)->firstOrFail();

        $gig = new Gig([
            'title' => $title,
            'description' => $description,
            'category' => $category,
            'province_id' => $client->province_id,
            'regency_id' => $client->regency_id,
            'province_name' => $client->province_name,
            'regency_name' => $client->regency_name,
            'location_address' => "Area {$client->regency_name}, {$client->province_name}",
            'work_date' => $at->toDateString(),
            'start_time' => $at->format('H:i:s'),
            'posted_fee' => $fee,
        ]);
        $gig->client()->associate($client);
        $gig->status = $status;
        $this->saveAt($gig, $at->subDays(5));
        $gig->media()->create([
            'path' => "database/seeders/assets/gigs/{$category->value}/".str_pad((string) $image, 2, '0', STR_PAD_LEFT).'.webp',
        ]);

        $offer = new GigOffer(['offered_fee' => $fee, 'note' => 'Saya siap mengikuti jadwal dan ruang lingkup pekerjaan.']);
        $offer->gig()->associate($gig);
        $offer->freelancer()->associate($freelancer);
        $offer->status = GigOfferStatus::ACCEPTED;
        $this->saveAt($offer, $at->subDays(4));

        $agreement = new GigAgreement([
            'accepted_fee' => $fee,
            'final_scope' => $description,
            'work_date' => $at->toDateString(),
            'start_time' => $at->format('H:i:s'),
            'location_arrangement' => "Bertemu di lokasi kerja di {$client->regency_name}.",
            'delivery_expectations' => 'Kirim foto hasil dan konfirmasi setelah pekerjaan selesai.',
            'final_total_price' => $fee,
            'terms_version' => 1,
            'submitted_at' => $at->subDays(3),
            'freelancer_confirmed_at' => $at->subDays(3)->addHour(),
        ]);
        $agreement->gig()->associate($gig);
        $agreement->acceptedOffer()->associate($offer);
        $this->saveAt($agreement, $at->subDays(3));

        $payment = new GigPayment([
            'amount' => $fee,
            'currency' => 'IDR',
            'local_reference' => 'seed-'.Str::slug($title),
            'provider' => 'mock',
            'provider_reference' => 'seed-'.Str::slug($title),
            'expires_at' => $at->subDays(2),
            'checkout_prepared_at' => $at->subDays(3)->addHours(2),
            'provider_paid_at' => $paymentStatus === GigPaymentStatus::Paid ? $at->subDays(2)->subHour() : null,
            'paid_at' => $paymentStatus === GigPaymentStatus::Paid ? $at->subDays(2)->subHour() : null,
            'cancelled_at' => $paymentStatus === GigPaymentStatus::Cancelled ? $at->subDays(2) : null,
            'expired_at' => $paymentStatus === GigPaymentStatus::Expired ? $at->subDays(2) : null,
        ]);
        $payment->gig()->associate($gig);
        $payment->agreement()->associate($agreement);
        $payment->status = $paymentStatus;
        $this->saveAt($payment, $at->subDays(3)->addHours(2));

        return [$gig, $agreement, $payment, $client, $freelancer];
    }

    private function seedConversation(
        GigAgreement $agreement,
        User $client,
        User $freelancer,
        CarbonImmutable $at,
        bool $completed,
    ): void {
        $this->systemMessage($agreement, GigWorkflowEvent::FreelancerSelected, "seed:{$agreement->id}:selected", $at->subDays(4));
        $this->systemMessage($agreement, GigWorkflowEvent::AgreementTermsSubmitted, "seed:{$agreement->id}:terms", $at->subDays(3));
        $this->userMessage($agreement, $client, $freelancer, 'Halo, mohon datang sesuai jadwal yang sudah disepakati.', $at->subDays(2), true);
        $this->userMessage($agreement, $freelancer, $client, 'Siap, saya sudah mencatat lokasi dan ruang lingkup pekerjaannya.', $at->subDays(2)->addMinutes(8), true);
        $this->systemMessage($agreement, GigWorkflowEvent::AgreementAccepted, "seed:{$agreement->id}:accepted", $at->subDays(3)->addHour());
        $this->systemMessage($agreement, GigWorkflowEvent::PaymentPending, "seed:{$agreement->id}:payment", $at->subDays(3)->addHours(2));

        if ($agreement->payment?->status === GigPaymentStatus::Paid) {
            $this->systemMessage($agreement, GigWorkflowEvent::PaymentConfirmed, "seed:{$agreement->id}:paid", $at->subDays(2));
            $this->systemMessage($agreement, GigWorkflowEvent::WorkStarted, "seed:{$agreement->id}:started", $at->addHour());
        }

        if ($completed) {
            $this->userMessage($agreement, $freelancer, $client, 'Pekerjaan sudah selesai. Saya juga sudah mengirim foto hasilnya.', $at->addHours(5), true);
            $this->userMessage($agreement, $client, $freelancer, 'Sudah saya periksa, hasilnya sesuai. Terima kasih.', $at->addHours(6), true);
            $this->systemMessage($agreement, GigWorkflowEvent::FinishSubmitted, "seed:{$agreement->id}:finish", $at->addHours(5));
            $this->systemMessage($agreement, GigWorkflowEvent::GigCompleted, "seed:{$agreement->id}:completed", $at->addHours(6));
        }
    }

    private function systemMessage(
        GigAgreement $agreement,
        GigWorkflowEvent $event,
        string $key,
        CarbonImmutable $at,
    ): void {
        $message = new GigMessage([
            'kind' => GigMessageKind::System,
            'workflow_event' => $event,
            'event_key' => $key,
            'event_snapshot' => [],
        ]);
        $message->agreement()->associate($agreement);
        $this->saveAt($message, $at);
    }

    private function userMessage(
        GigAgreement $agreement,
        User $sender,
        User $recipient,
        string $body,
        CarbonImmutable $at,
        bool $read,
    ): GigMessage {
        $message = new GigMessage([
            'kind' => GigMessageKind::User,
            'body' => $body,
            'read_at' => $read ? $at->addMinutes(2) : null,
        ]);
        $message->agreement()->associate($agreement);
        $message->sender()->associate($sender);
        $message->recipient()->associate($recipient);
        $this->saveAt($message, $at);

        return $message;
    }

    private function rating(
        Gig $gig,
        User $rater,
        User $recipient,
        int $score,
        string $comment,
        CarbonImmutable $at,
    ): void {
        $rating = new GigRating(['score' => $score, 'comment' => $comment]);
        $rating->gig()->associate($gig);
        $rating->rater()->associate($rater);
        $rating->recipient()->associate($recipient);
        $this->saveAt($rating, $at);
    }

    private function submission(
        GigDispute $dispute,
        User $author,
        GigDisputeSubmissionType $type,
        string $statement,
        CarbonImmutable $at,
    ): GigDisputeSubmission {
        $submission = new GigDisputeSubmission([
            'type' => $type,
            'statement' => $statement,
            'submitted_at' => $at,
        ]);
        $submission->dispute()->associate($dispute);
        $submission->author()->associate($author);
        $this->saveAt($submission, $at);

        return $submission;
    }

    private function completionNote(GigCategory $category): string
    {
        return match ($category) {
            GigCategory::Labor => 'Seluruh barang telah diturunkan dan ditata sesuai arahan pemilik toko.',
            GigCategory::Cleaning => 'Ruangan, lantai, dan jendela telah dibersihkan sesuai ruang lingkup.',
            GigCategory::Moving => 'Perabot dan kardus telah dipindahkan serta disusun di lokasi baru.',
            GigCategory::Construction => 'Perbaikan telah selesai dan area kerja sudah dirapikan.',
            GigCategory::Security => 'Penjagaan selesai dan area tetap tertib sampai acara berakhir.',
        };
    }

    private function gigExists(string $title, string $clientEmail): bool
    {
        return Gig::query()
            ->where('title', $title)
            ->whereHas('client', fn ($query) => $query->where('email', $clientEmail))
            ->exists();
    }

    private function saveAt(Model $model, CarbonImmutable $at): void
    {
        $model->forceFill(['created_at' => $at, 'updated_at' => $at]);
        $model->save();
    }
}
