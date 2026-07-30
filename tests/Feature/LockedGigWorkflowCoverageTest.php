<?php

use App\Actions\Agreement\AcceptGigAgreement;
use App\Actions\Agreement\SubmitGigAgreementTerms;
use App\Actions\Dispute\ExpireGigDisputeCounterproof;
use App\Actions\Dispute\OpenGigDispute;
use App\Actions\Dispute\ResolveGigDispute;
use App\Actions\Dispute\SubmitGigDisputeCounterproof;
use App\Actions\Gig\AcceptGigOffer;
use App\Actions\Payment\MarkGigPaymentPaid;
use App\Actions\Workflow\ProceedWithLockedGigExit;
use App\Actions\Workflow\RequestLockedGigExit;
use App\Actions\Workflow\RespondToLockedGigExit;
use App\Actions\Workflow\StartGig;
use App\Actions\Workflow\WithdrawLockedGigExit;
use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigExitDecision;
use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

function lockedGigCoverage(int $total = 100_000): array
{
    mock(NotificationService::class)->shouldReceive('send')->zeroOrMoreTimes();
    $client = User::factory()->client()->create();
    $freelancer = User::factory()->freelancer()->create();
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

    return [$client, $freelancer, $gig, $payment];
}

test('active locked exit blocks start, duplicate exits, and disputes', function () {
    [$client, $freelancer, $gig] = lockedGigCoverage();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    $request = app(RequestLockedGigExit::class)->execute($client, $gig, GigExitType::ClientCancellation, 'Perlu dibatalkan');
    Storage::fake('cos-private');

    expect(fn () => app(StartGig::class)->execute($client, $gig))->toThrow(DomainException::class)
        ->and(fn () => app(RequestLockedGigExit::class)->execute($freelancer, $gig, GigExitType::FreelancerAbandonment, 'Tidak bisa lanjut'))->toThrow(DomainException::class)
        ->and(fn () => app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Tidak hadir', [UploadedFile::fake()->image('evidence.jpg')]))->toThrow(DomainException::class)
        ->and($request->refresh()->status)->toBe(GigExitStatus::Pending)
        ->and($gig->refresh()->status)->toBe(GigStatus::Locked)
        ->and(Storage::disk('cos-private')->allFiles())->toBeEmpty();
});

test('actions require a statement and one to five valid evidence photos', function () {
    [$client, $freelancer, $gig] = lockedGigCoverage();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');

    expect(fn () => app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, ' ', []))->toThrow(DomainException::class)
        ->and($gig->dispute()->exists())->toBeFalse()
        ->and(Storage::disk('cos-private')->allFiles())->toBeEmpty();

    $dispute = app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Tidak hadir.', [UploadedFile::fake()->image('report.jpg')]);

    expect(fn () => app(SubmitGigDisputeCounterproof::class)->execute($freelancer, $dispute, ' ', []))->toThrow(DomainException::class)
        ->and($dispute->refresh()->submissions()->count())->toBe(1);
});

test('requester can withdraw a refused exit or execute it unilaterally', function () {
    [$client, $freelancer, $gig] = lockedGigCoverage();
    $request = app(RequestLockedGigExit::class)->execute($client, $gig, GigExitType::ClientCancellation, 'Batalkan');
    app(RespondToLockedGigExit::class)->execute($freelancer, $request, GigExitDecision::Refuse);
    app(WithdrawLockedGigExit::class)->execute($client, $request);

    expect($request->refresh()->status)->toBe(GigExitStatus::Withdrawn)
        ->and($gig->refresh()->status)->toBe(GigStatus::Locked);

    $second = app(RequestLockedGigExit::class)->execute($client, $gig, GigExitType::ClientCancellation, 'Batalkan lagi');
    app(RespondToLockedGigExit::class)->execute($freelancer, $second, GigExitDecision::Refuse);
    app(ProceedWithLockedGigExit::class)->execute($client, $second);

    expect($second->refresh()->status)->toBe(GigExitStatus::Executed)
        ->and($second->execution_mode->value)->toBe('unilateral')
        ->and($gig->refresh()->status)->toBe(GigStatus::Cancelled);
});

test('thirty seventy settlement uses floor arithmetic from final terms', function () {
    [$client, $freelancer, $gig] = lockedGigCoverage(100_001);
    $request = app(RequestLockedGigExit::class)->execute($client, $gig, GigExitType::ClientCancellation, 'Batalkan');
    app(ProceedWithLockedGigExit::class)->execute($client, $request);

    expect($gig->settlement->freelancer_payout)->toBe(30_000)
        ->and($gig->settlement->client_refund)->toBe(70_001)
        ->and($gig->settlement->total_amount)->toBe(100_001);
});

test('paid amount mismatch prevents locked work from starting', function () {
    [$client, $freelancer, $gig, $payment] = lockedGigCoverage();
    $payment->update(['amount' => $payment->amount + 1]);

    expect(fn () => app(StartGig::class)->execute($client, $gig))->toThrow(DomainException::class)
        ->and($gig->refresh()->status)->toBe(GigStatus::Locked);
});

test('counterproof immediately before its deadline moves the dispute to admin', function () {
    [$client, $freelancer, $gig] = lockedGigCoverage();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');
    $dispute = app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Tidak hadir', [UploadedFile::fake()->image('report.jpg')]);
    $dispute->update(['counterproof_due_at' => now()->addSecond()]);

    app(SubmitGigDisputeCounterproof::class)->execute($freelancer, $dispute, 'Saya hadir.', [UploadedFile::fake()->image('counter.jpg')]);

    expect($dispute->refresh()->status)->toBe(GigDisputeStatus::AwaitingAdmin)
        ->and($dispute->submissions()->count())->toBe(2);
});

test('start blocked timeout settles thirty seventy and punishes the client', function () {
    [$client, $freelancer, $gig] = lockedGigCoverage();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');
    $dispute = app(OpenGigDispute::class)->execute($freelancer, $gig, GigDisputeType::StartBlocked, 'Tidak dapat mulai', [UploadedFile::fake()->image('report.jpg')]);
    $dispute->update(['counterproof_due_at' => now()]);

    app(ExpireGigDisputeCounterproof::class)->execute($dispute);

    expect($gig->refresh()->status)->toBe(GigStatus::DisputeResolved)
        ->and($gig->settlement->outcome)->toBe(GigSettlementOutcome::ThirtySeventy)
        ->and($client->gigOffenses()->count())->toBe(1)
        ->and($freelancer->gigOffenses()->count())->toBe(0);
});

test('admin supports every finding and only inconclusive accepts a selected outcome', function () {
    foreach ([
        [GigDisputeFinding::FreelancerAtFault, null, GigSettlementOutcome::FullClientRefund],
        [GigDisputeFinding::ClientAtFault, null, GigSettlementOutcome::ThirtySeventy],
        [GigDisputeFinding::Inconclusive, GigSettlementOutcome::FullFreelancerPayout, GigSettlementOutcome::FullFreelancerPayout],
    ] as [$finding, $choice, $expected]) {
        [$client, $freelancer, $gig] = lockedGigCoverage();
        $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
        Storage::fake('cos-private');
        $dispute = app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Tidak hadir', [UploadedFile::fake()->image('report.jpg')]);
        app(SubmitGigDisputeCounterproof::class)->execute($freelancer, $dispute, 'Saya hadir.', [UploadedFile::fake()->image('counter.jpg')]);
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        app(ResolveGigDispute::class)->execute($admin, $dispute, $finding, $choice, 'Keputusan admin lengkap.');

        expect($gig->refresh()->settlement->outcome)->toBe($expected);
    }
});

test('counterproof expiry command resolves each due dispute without stopping the queue', function () {
    [$client, $freelancer, $gig] = lockedGigCoverage();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');
    $dispute = app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Tidak hadir', [UploadedFile::fake()->image('report.jpg')]);
    $dispute->update(['counterproof_due_at' => now()]);

    expect(Artisan::call('gig-disputes:expire-counterproofs'))->toBe(0)
        ->and($dispute->refresh()->status)->toBe(GigDisputeStatus::Resolved)
        ->and($gig->refresh()->status)->toBe(GigStatus::DisputeResolved);
});

test('notification failures never undo a committed start transition', function () {
    [$client, $freelancer, $gig] = lockedGigCoverage();
    mock(NotificationService::class)->shouldReceive('send')->andThrow(new RuntimeException('Notification unavailable.'));

    app(StartGig::class)->execute($client, $gig);

    expect($gig->refresh()->status)->toBe(GigStatus::InProgress)
        ->and($gig->started_at)->not->toBeNull();
});
