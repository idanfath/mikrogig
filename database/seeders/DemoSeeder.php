<?php

namespace Database\Seeders;

use App\Enums\GigCategory;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeSubmissionType;
use App\Enums\GigDisputeType;
use App\Enums\GigEstimatedDuration;
use App\Enums\GigMessageKind;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Enums\GigWorkflowEvent;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigDispute;
use App\Models\GigDisputeSubmission;
use App\Models\GigMessage;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\WageBenchmarkService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoSeeder extends Seeder
{
    use WithoutModelEvents;

    public function __construct(private WageBenchmarkService $wageBenchmark) {}

    public function run(): void
    {
        $this->call(DatabaseSeeder::class);

        if (Gig::query()->where('title', 'Pindahkan dan Tata Ulang Rak Toko')->exists()) {
            return;
        }

        DB::transaction(function (): void {
            $client = User::query()->where('email', 'client@example.com')->firstOrFail();
            $freelancer = User::query()->where('email', 'freelancer@example.com')->firstOrFail();
            $workAt = CarbonImmutable::now()->subDays(2)->startOfDay()->setTime(9, 0);
            $openedAt = $workAt->addHours(3);
            $duration = GigEstimatedDuration::TwoToFourHours;
            $benchmark = $this->wageBenchmark->calculate('51', $duration);

            $gig = new Gig([
                'title' => 'Pindahkan dan Tata Ulang Rak Toko',
                'description' => 'Memindahkan dua rak besi, menata ulang kardus persediaan, dan memastikan jalur pelanggan tetap dapat dilewati setelah pekerjaan.',
                'category' => GigCategory::Moving,
                'province_id' => '51',
                'regency_id' => '5171',
                'province_name' => 'BALI',
                'regency_name' => 'KOTA DENPASAR',
                'location_address' => 'Toko kelontong area Denpasar Barat, Kota Denpasar',
                'location_latitude' => -8.670458,
                'location_longitude' => 115.212629,
                'location_accuracy_meters' => 25,
                'work_date' => $workAt->toDateString(),
                'start_time' => $workAt->format('H:i:s'),
                'estimated_duration' => $duration,
                'posted_fee' => 425_000,
                'wage_benchmark_minimum' => $benchmark['minimum'],
                'wage_benchmark_maximum' => $benchmark['maximum'],
                'wage_benchmark_year' => $benchmark['year'],
            ]);
            $gig->client()->associate($client);
            $gig->status = GigStatus::Disputed;
            $gig->started_at = $workAt;
            $this->saveAt($gig, $workAt->subDays(5));
            $gig->media()->createMany([
                ['path' => 'database/seeders/assets/gigs/moving/04.webp'],
                ['path' => 'database/seeders/assets/gigs/moving/05.webp'],
            ]);

            $offer = new GigOffer([
                'offered_fee' => 400_000,
                'note' => 'Saya dapat membawa tali pengikat dan membantu pemindahan rak sesuai jadwal.',
            ]);
            $offer->gig()->associate($gig);
            $offer->freelancer()->associate($freelancer);
            $offer->status = GigOfferStatus::ACCEPTED;
            $this->saveAt($offer, $workAt->subDays(4));

            $agreement = new GigAgreement([
                'accepted_fee' => 400_000,
                'estimated_duration' => $duration,
                'final_scope' => 'Memindahkan dua rak besi ke sisi belakang toko dan menata kardus agar tersedia jalur pelanggan selebar kurang lebih satu meter.',
                'work_date' => $workAt->toDateString(),
                'start_time' => $workAt->format('H:i:s'),
                'location_arrangement' => 'Bertemu di pintu utama toko. Klien memastikan jalur dan area sekitar rak sudah dikosongkan sebelum pekerjaan dimulai.',
                'delivery_expectations' => 'Kirim foto posisi akhir kedua rak dan jalur pelanggan setelah area selesai ditata.',
                'final_total_price' => 400_000,
                'wage_benchmark_minimum' => $benchmark['minimum'],
                'wage_benchmark_maximum' => $benchmark['maximum'],
                'wage_benchmark_year' => $benchmark['year'],
                'terms_version' => 1,
                'submitted_at' => $workAt->subDays(3),
                'freelancer_confirmed_at' => $workAt->subDays(3)->addMinutes(25),
            ]);
            $agreement->gig()->associate($gig);
            $agreement->acceptedOffer()->associate($offer);
            $this->saveAt($agreement, $workAt->subDays(3));

            $payment = new GigPayment([
                'amount' => 400_000,
                'currency' => 'IDR',
                'local_reference' => 'seed-demo-work-obstruction',
                'provider' => 'mock',
                'provider_reference' => 'seed-demo-paid',
                'expires_at' => $workAt->subDay(),
                'checkout_prepared_at' => $workAt->subDays(3)->addHour(),
                'provider_paid_at' => $workAt->subDays(2),
                'paid_at' => $workAt->subDays(2),
            ]);
            $payment->gig()->associate($gig);
            $payment->agreement()->associate($agreement);
            $payment->status = GigPaymentStatus::Paid;
            $this->saveAt($payment, $workAt->subDays(3)->addHour());

            $dispute = new GigDispute([
                'type' => GigDisputeType::WorkObstruction,
                'opened_at' => $openedAt,
                'counterproof_due_at' => CarbonImmutable::now()->addDay(),
            ]);
            $dispute->gig()->associate($gig);
            $dispute->agreement()->associate($agreement);
            $dispute->payment()->associate($payment);
            $dispute->reporter()->associate($freelancer);
            $dispute->respondent()->associate($client);
            $dispute->status = GigDisputeStatus::AwaitingAdmin;
            $this->saveAt($dispute, $openedAt);

            $report = $this->submission(
                dispute: $dispute,
                author: $freelancer,
                type: GigDisputeSubmissionType::Report,
                statement: 'Saya tiba sesuai jadwal, tetapi jalur menuju rak tertutup kardus, sepeda motor, dan barang dagangan. Saya sudah meminta area dikosongkan sesuai kesepakatan, namun ruang yang tersedia tidak cukup untuk mengangkat rak dengan aman. Klien kemudian meminta pekerjaan tetap dilanjutkan tanpa memindahkan penghalang.',
                at: $openedAt,
            );
            $report->media()->createMany([
                ['path' => 'database/seeders/assets/demo/work-obstruction/report-01.webp'],
                ['path' => 'database/seeders/assets/demo/work-obstruction/report-02.webp'],
            ]);

            $counterproof = $this->submission(
                dispute: $dispute,
                author: $client,
                type: GigDisputeSubmissionType::Counterproof,
                statement: 'Pintu utama sudah dibuka dan beberapa kardus telah saya geser. Menurut saya masih ada jalur menuju rak dan alat kerja juga sudah tersedia. Saya mengirim foto dari sisi depan toko untuk menunjukkan kondisi setelah sebagian barang dipindahkan.',
                at: $openedAt->addHours(4),
            );
            $counterproof->media()->createMany([
                ['path' => 'database/seeders/assets/demo/work-obstruction/counterproof-01.webp'],
                ['path' => 'database/seeders/assets/demo/work-obstruction/counterproof-02.webp'],
            ]);

            $this->seedConversation($agreement, $client, $freelancer, $workAt, $dispute);
        }, attempts: 3);
    }

    private function seedConversation(
        GigAgreement $agreement,
        User $client,
        User $freelancer,
        CarbonImmutable $workAt,
        GigDispute $dispute,
    ): void {
        $this->systemMessage($agreement, GigWorkflowEvent::FreelancerSelected, 'seed:demo:selected', $workAt->subDays(4), [
            'accepted_fee' => 400_000,
        ]);
        $this->systemMessage($agreement, GigWorkflowEvent::AgreementTermsSubmitted, 'seed:demo:terms', $workAt->subDays(3), [
            'terms_version' => 1,
            'final_total_price' => 400_000,
        ]);
        $this->systemMessage($agreement, GigWorkflowEvent::AgreementAccepted, 'seed:demo:accepted', $workAt->subDays(3)->addMinutes(25));
        $this->systemMessage($agreement, GigWorkflowEvent::PaymentPending, 'seed:demo:payment', $workAt->subDays(3)->addHour(), [
            'amount' => 400_000,
            'currency' => 'IDR',
        ]);
        $this->systemMessage($agreement, GigWorkflowEvent::PaymentConfirmed, 'seed:demo:paid', $workAt->subDays(2), [
            'amount' => 400_000,
            'currency' => 'IDR',
        ]);

        $this->userMessage($agreement, $client, $freelancer, 'Halo Kak Raka, jadwal lusa pukul 09.00 tetap ya. Dua rak akan dipindahkan ke bagian belakang.', $workAt->subDays(2)->addHour(), true);
        $this->userMessage($agreement, $freelancer, $client, 'Siap Bu Nadia. Mohon area sekitar rak dan jalurnya dikosongkan sebelum saya datang.', $workAt->subDays(2)->addHours(1)->addMinutes(8), true);
        $this->userMessage($agreement, $client, $freelancer, 'Baik, nanti kardusnya saya rapikan lebih dulu.', $workAt->subDays(2)->addHours(1)->addMinutes(13), true);
        $this->userMessage($agreement, $freelancer, $client, 'Saya sudah di depan toko.', $workAt->subMinutes(8), true);
        $blocked = $this->userMessage($agreement, $freelancer, $client, 'Pintu samping masih terkunci dan jalur utama cukup penuh. Saya kirim kondisinya.', $workAt->addMinutes(7), true);
        $blocked->media()->create([
            'path' => 'database/seeders/assets/demo/chat/blocked-access.webp',
            'mime_type' => 'image/webp',
            'display_order' => 0,
        ]);
        $this->userMessage($agreement, $client, $freelancer, 'Masuk dari pintu depan saja. Saya sedang memindahkan beberapa kardus.', $workAt->addMinutes(13), true);
        $opened = $this->userMessage($agreement, $client, $freelancer, 'Sekarang pintu depan terbuka dan ada jalur menuju rak. Ini fotonya.', $workAt->addMinutes(32), true);
        $opened->media()->create([
            'path' => 'database/seeders/assets/demo/chat/open-access.webp',
            'mime_type' => 'image/webp',
            'display_order' => 0,
        ]);
        $this->systemMessage($agreement, GigWorkflowEvent::WorkStarted, 'seed:demo:started', $workAt, [
            'started_at' => $workAt->toISOString(),
        ]);
        $this->userMessage($agreement, $freelancer, $client, 'Jalurnya masih terlalu sempit untuk dua orang mengangkat rak. Ada sepeda motor dan barang di sisi rak.', $workAt->addMinutes(38), true);
        $this->userMessage($agreement, $client, $freelancer, 'Menurut saya rak masih bisa digeser sedikit demi sedikit. Tolong lanjutkan dulu.', $workAt->addMinutes(44), true);
        $this->userMessage($agreement, $freelancer, $client, 'Saya tidak bisa melanjutkan dengan aman karena ruang angkat tidak sesuai kesepakatan. Saya akan mencatat kondisinya.', $workAt->addMinutes(51), true);
        $this->systemMessage($agreement, GigWorkflowEvent::DisputeOpened, 'seed:demo:dispute', $dispute->opened_at, [
            'type' => GigDisputeType::WorkObstruction->value,
            'counterproof_due_at' => $dispute->counterproof_due_at->toISOString(),
        ]);
        $this->systemMessage($agreement, GigWorkflowEvent::CounterproofSubmitted, 'seed:demo:counterproof', $dispute->opened_at->addHours(4));
        $this->userMessage($agreement, $client, $freelancer, 'Saya sudah mengirim kondisi dari sisi depan untuk diperiksa admin.', $dispute->opened_at->addHours(4)->addMinutes(5), false);
        $this->userMessage($agreement, $freelancer, $client, 'Baik, saya juga sudah melengkapi laporan dengan foto dari area rak.', $dispute->opened_at->addHours(4)->addMinutes(9), false);

    }

    /**
     * @param  array<string, mixed>  $snapshot
     */
    private function systemMessage(
        GigAgreement $agreement,
        GigWorkflowEvent $event,
        string $key,
        CarbonImmutable $at,
        array $snapshot = [],
    ): void {
        $message = new GigMessage([
            'kind' => GigMessageKind::System,
            'workflow_event' => $event,
            'event_key' => $key,
            'event_snapshot' => $snapshot,
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
            'read_at' => $read ? $at->addMinute() : null,
        ]);
        $message->agreement()->associate($agreement);
        $message->sender()->associate($sender);
        $message->recipient()->associate($recipient);
        $this->saveAt($message, $at);

        return $message;
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

    private function saveAt(Model $model, CarbonImmutable $at): void
    {
        $model->forceFill(['created_at' => $at, 'updated_at' => $at]);
        $model->save();
    }
}
