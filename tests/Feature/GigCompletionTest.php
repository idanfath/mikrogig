<?php

use App\Actions\Agreement\AcceptGigAgreement;
use App\Actions\Agreement\SubmitGigAgreementTerms;
use App\Actions\Dispute\ExpireGigDisputeCounterproof;
use App\Actions\Dispute\OpenGigDispute;
use App\Actions\Dispute\ResolveGigDispute;
use App\Actions\Dispute\SubmitGigDisputeCounterproof;
use App\Actions\Gig\AcceptGigOffer;
use App\Actions\Payment\MarkGigPaymentPaid;
use App\Actions\Workflow\AcceptGigFinishRequest;
use App\Actions\Workflow\AutoAcceptGigFinishRequest;
use App\Actions\Workflow\RejectGigFinishRequest;
use App\Actions\Workflow\StartGig;
use App\Actions\Workflow\SubmitGigFinishRequest;
use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigFinishRequestStatus;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigFinishRequest;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

beforeEach(function () {
    Storage::fake('cos-private');
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->zeroOrMoreTimes()
        ->shouldReceive('unreadCount')
        ->zeroOrMoreTimes()
        ->andReturn(0);
});

function inProgressGig(int $total = 100_000): array
{
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create();
    $offer = GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->create();
    app(AcceptGigOffer::class)->execute($client, $offer);
    app(SubmitGigAgreementTerms::class)->execute($client, $gig, [
        'final_scope' => 'Scope',
        'work_date' => now()->addDay()->toDateString(),
        'start_time' => '10:00',
        'location_arrangement' => 'Lokasi',
        'delivery_expectations' => 'Selesai',
        'estimated_duration' => $gig->estimated_duration->value,
        'final_total_price' => $total,
    ]);
    app(AcceptGigAgreement::class)->execute($freelancer, $gig);
    $payment = GigPayment::query()->where('gig_id', $gig->id)->sole();
    app(MarkGigPaymentPaid::class)->execute($payment, $payment->local_reference, $payment->amount, now());
    app(StartGig::class)->execute($client, $gig);

    return [$client, $freelancer, $gig, $payment];
}

function submitCompletion(User $freelancer, Gig $gig, string $note = 'Pekerjaan selesai.'): GigFinishRequest
{
    return app(SubmitGigFinishRequest::class)->execute(
        $freelancer,
        $gig,
        $note,
        [
            UploadedFile::fake()->image('first.jpg'),
            UploadedFile::fake()->image('second.png'),
        ],
    );
}

test('finish request model factory provides casts relationships and lifecycle states', function () {
    $pending = GigFinishRequest::factory()->create();
    $accepted = GigFinishRequest::factory()->accepted()->create();
    $rejected = GigFinishRequest::factory()->rejected()->create();
    $autoAccepted = GigFinishRequest::factory()->autoAccepted()->create();

    expect($pending->status)->toBe(GigFinishRequestStatus::Pending)
        ->and($pending->review_due_at)->not->toBeNull()
        ->and($pending->gig_id)->toBe($pending->payment->gig_id)
        ->and($pending->freelancer_id)->toBe($pending->payment->agreement->acceptedOffer->freelancer_id)
        ->and($accepted->status)->toBe(GigFinishRequestStatus::Accepted)
        ->and($rejected->status)->toBe(GigFinishRequestStatus::Rejected)
        ->and($rejected->rejection_reason)->not->toBeEmpty()
        ->and($autoAccepted->status)->toBe(GigFinishRequestStatus::AutoAccepted);
});

test('accepted freelancer submits ordered private proof and failed authorization rolls uploads back', function () {
    [$client, $freelancer, $gig, $payment] = inProgressGig();
    $otherFreelancer = User::factory()->freelancer()->create();

    expect(fn () => app(SubmitGigFinishRequest::class)->execute(
        $otherFreelancer,
        $gig,
        'Bukan pekerjaan saya.',
        [UploadedFile::fake()->image('unauthorized.jpg')],
    ))->toThrow(AuthorizationException::class)
        ->and(Storage::disk('cos-private')->allFiles())->toBeEmpty();

    $finishRequest = submitCompletion($freelancer, $gig);

    expect($finishRequest->gig_id)->toBe($gig->id)
        ->and($finishRequest->gig_payment_id)->toBe($payment->id)
        ->and($finishRequest->freelancer_id)->toBe($freelancer->id)
        ->and($finishRequest->status)->toBe(GigFinishRequestStatus::Pending)
        ->and($finishRequest->media()->orderBy('id')->pluck('path')->all())->toHaveCount(2)
        ->and($gig->refresh()->status)->toBe(GigStatus::Review)
        ->and(fn () => submitCompletion($freelancer, $gig))->toThrow(DomainException::class)
        ->and($gig->finishRequests()->pending()->count())->toBe(1);
});

test('client acceptance records exact full payout and completes the gig', function () {
    [$client, $freelancer, $gig] = inProgressGig(100_001);
    $finishRequest = submitCompletion($freelancer, $gig);

    app(AcceptGigFinishRequest::class)->execute($client, $finishRequest);

    expect($finishRequest->refresh()->status)->toBe(GigFinishRequestStatus::Accepted)
        ->and($finishRequest->reviewer->is($client))->toBeTrue()
        ->and($gig->refresh()->status)->toBe(GigStatus::Completed)
        ->and($gig->completed_at)->not->toBeNull()
        ->and($gig->settlement->outcome)->toBe(GigSettlementOutcome::FullFreelancerPayout)
        ->and($gig->settlement->freelancer_payout)->toBe(100_001)
        ->and($gig->settlement->client_refund)->toBe(0)
        ->and($gig->settlement->gig_finish_request_id)->toBe($finishRequest->id)
        ->and($freelancer->refresh()->hasActiveAcceptedWork())->toBeFalse();
});

test('rejection requires reason and permits repeated resubmission', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $first = submitCompletion($freelancer, $gig, 'Percobaan pertama.');

    expect(fn () => app(RejectGigFinishRequest::class)->execute($client, $first, ' '))->toThrow(DomainException::class);

    app(RejectGigFinishRequest::class)->execute($client, $first, 'Bagian belakang belum selesai.');
    $second = submitCompletion($freelancer, $gig, 'Percobaan kedua.');
    app(RejectGigFinishRequest::class)->execute($client, $second, 'Masih perlu dirapikan.');

    expect($first->refresh()->status)->toBe(GigFinishRequestStatus::Rejected)
        ->and($first->rejection_reason)->toBe('Bagian belakang belum selesai.')
        ->and($second->refresh()->status)->toBe(GigFinishRequestStatus::Rejected)
        ->and($gig->refresh()->status)->toBe(GigStatus::InProgress)
        ->and($gig->finishRequests()->count())->toBe(2)
        ->and($gig->settlement()->exists())->toBeFalse();
});

test('automatic acceptance owns the deadline and is idempotent', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $finishRequest = submitCompletion($freelancer, $gig);

    expect(fn () => app(AutoAcceptGigFinishRequest::class)->execute($finishRequest))->toThrow(DomainException::class);

    $finishRequest->update(['review_due_at' => now()]);
    expect(fn () => app(AcceptGigFinishRequest::class)->execute($client, $finishRequest))->toThrow(DomainException::class);

    app(AutoAcceptGigFinishRequest::class)->execute($finishRequest);
    app(AutoAcceptGigFinishRequest::class)->execute($finishRequest);

    expect($finishRequest->refresh()->status)->toBe(GigFinishRequestStatus::AutoAccepted)
        ->and($gig->refresh()->status)->toBe(GigStatus::Completed)
        ->and($gig->settlement()->count())->toBe(1)
        ->and(Artisan::call('gig-finish-requests:auto-accept'))->toBe(0);
});

test('work obstruction timeout pays freelancer fully and punishes client', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $dispute = app(OpenGigDispute::class)->execute(
        $freelancer,
        $gig,
        GigDisputeType::WorkObstruction,
        'Klien menghalangi penyelesaian.',
        [UploadedFile::fake()->image('obstruction.jpg')],
    );
    $dispute->update(['counterproof_due_at' => now()]);

    app(ExpireGigDisputeCounterproof::class)->execute($dispute);

    expect($dispute->refresh()->status)->toBe(GigDisputeStatus::Resolved)
        ->and($gig->refresh()->status)->toBe(GigStatus::DisputeResolved)
        ->and($gig->settlement->outcome)->toBe(GigSettlementOutcome::FullFreelancerPayout)
        ->and($client->gigOffenses()->count())->toBe(1)
        ->and($freelancer->gigOffenses()->count())->toBe(0)
        ->and($freelancer->refresh()->hasActiveAcceptedWork())->toBeFalse();
});

test('finish rejected dispute links only latest rejection and allows no additional photos', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $first = submitCompletion($freelancer, $gig, 'Pertama.');
    app(RejectGigFinishRequest::class)->execute($client, $first, 'Alasan pertama.');
    $second = submitCompletion($freelancer, $gig, 'Kedua.');
    app(RejectGigFinishRequest::class)->execute($client, $second, 'Alasan kedua.');

    $dispute = app(OpenGigDispute::class)->execute(
        $freelancer,
        $gig,
        GigDisputeType::FinishRejected,
        'Penolakan kedua tidak sesuai.',
        [],
    );

    expect($dispute->gig_finish_request_id)->toBe($second->id)
        ->and($dispute->gig_finish_request_id)->not->toBe($first->id)
        ->and($dispute->submissions()->sole()->media()->count())->toBe(0)
        ->and($gig->refresh()->status)->toBe(GigStatus::Disputed);
});

test('finish rejected dispute accepts optional additional private photos', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $finishRequest = submitCompletion($freelancer, $gig);
    app(RejectGigFinishRequest::class)->execute($client, $finishRequest, 'Bukti belum meyakinkan.');

    $dispute = app(OpenGigDispute::class)->execute(
        $freelancer,
        $gig,
        GigDisputeType::FinishRejected,
        'Bukti tambahan menjelaskan hasil akhir.',
        [UploadedFile::fake()->image('additional.webp')],
    );

    expect($dispute->finishRequest->is($finishRequest))->toBeTrue()
        ->and($dispute->submissions()->sole()->media()->count())->toBe(1);
});

test('completion actions reject stale association mismatches', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $finishRequest = submitCompletion($freelancer, $gig);
    $otherGig = Gig::factory()->for($client, 'client')->create(['status' => GigStatus::Review]);
    $finishRequest->gig()->associate($otherGig);
    $finishRequest->save();

    expect(fn () => app(AcceptGigFinishRequest::class)->execute($client, $finishRequest))
        ->toThrow(DomainException::class)
        ->and($gig->settlement()->exists())->toBeFalse()
        ->and($otherGig->settlement()->exists())->toBeFalse()
        ->and($finishRequest->refresh()->status)->toBe(GigFinishRequestStatus::Pending);
});

test('new dispute types reuse counterproof and derive post-start admin outcomes', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $dispute = app(OpenGigDispute::class)->execute(
        $freelancer,
        $gig,
        GigDisputeType::WorkObstruction,
        'Akses dihentikan.',
        [UploadedFile::fake()->image('report.jpg')],
    );
    app(SubmitGigDisputeCounterproof::class)->execute(
        $client,
        $dispute,
        'Counterproof klien.',
        [UploadedFile::fake()->image('counterproof.jpg')],
    );
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    app(ResolveGigDispute::class)->execute(
        $admin,
        $dispute,
        GigDisputeFinding::ClientAtFault,
        null,
        'Klien terbukti menghalangi pekerjaan.',
    );

    expect($gig->refresh()->settlement->outcome)->toBe(GigSettlementOutcome::FullFreelancerPayout)
        ->and($client->gigOffenses()->count())->toBe(1);
});

test('workflow HTTP props and private media expose only valid completion controls', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $unrelated = User::factory()->freelancer()->create(['onboarding_step' => null]);

    $this->actingAs($freelancer)
        ->get(route('app.gigs.workflow.show', $gig))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('capabilities.canSubmitFinishRequest', true)
            ->where('capabilities.canReportWorkObstruction', true)
            ->where('capabilities.canAcceptFinishRequest', false));

    $this->actingAs($freelancer)
        ->post(route('app.gigs.finish_requests.store', $gig), [
            'completion_note' => 'Selesai melalui HTTP.',
            'photos' => [UploadedFile::fake()->image('proof.jpg')],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $finishRequest = $gig->finishRequests()->with('media')->sole();
    $media = $finishRequest->media->sole();

    $this->actingAs($client)
        ->get(route('app.gigs.workflow.show', $gig))
        ->assertInertia(fn (Assert $page) => $page
            ->where('finish_request.id', $finishRequest->id)
            ->where('capabilities.canAcceptFinishRequest', true)
            ->where('capabilities.canRejectFinishRequest', true)
            ->where('capabilities.canSubmitFinishRequest', false));

    $this->actingAs($unrelated)
        ->get(route('app.gig_finish_request_media.show', $media))
        ->assertNotFound();

    $this->actingAs($client)
        ->get(route('app.gig_finish_request_media.show', $media))
        ->assertOk();

    $admin = User::factory()->create(['role' => UserRole::Admin, 'onboarding_step' => null]);
    $this->actingAs($admin)
        ->get(route('app.gig_finish_request_media.show', $media))
        ->assertOk();
});

test('completion notifications include destinations and failures do not undo state', function () {
    [$client, $freelancer, $gig] = inProgressGig();
    $notifications = [];
    $sendCount = 0;
    mock(NotificationService::class)->shouldReceive('send')->times(4)->andReturnUsing(
        function (...$arguments) use (&$notifications, &$sendCount): void {
            $sendCount++;
            if ($sendCount === 4) {
                throw new RuntimeException('Notification unavailable.');
            }

            $notifications[] = $arguments;
        },
    );

    $finishRequest = submitCompletion($freelancer, $gig);
    app(RejectGigFinishRequest::class)->execute($client, $finishRequest, 'Perlu dirapikan.');

    expect($notifications[0][4])->toBe([$client->id])
        ->and($notifications[0][6])->toBe(route('app.gigs.workflow.show', $gig))
        ->and($notifications[0][7])->toBe('Tinjau Pekerjaan')
        ->and($notifications[1][4])->toBe([$freelancer->id])
        ->and($notifications[1][6])->toBe(route('app.gigs.workflow.show', $gig))
        ->and($notifications[1][7])->toBe('Lihat Alasan');

    $second = submitCompletion($freelancer, $gig);
    app(AcceptGigFinishRequest::class)->execute($client, $second);

    expect($second->refresh()->status)->toBe(GigFinishRequestStatus::Accepted)
        ->and($gig->refresh()->status)->toBe(GigStatus::Completed)
        ->and($gig->settlement()->count())->toBe(1);
});
