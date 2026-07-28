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
use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigExitDecision;
use App\Enums\GigExitType;
use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigDisputeMedia;
use App\Models\GigOffense;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Models\UserBan;
use App\Services\NotificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

function lockedWorkflow(): array
{
    mock(NotificationService::class)->shouldReceive('send')->zeroOrMoreTimes();
    $client = User::factory()->client()->create();
    $freelancer = User::factory()->freelancer()->create();
    $gig = Gig::factory()->for($client, 'client')->create();
    $offer = GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->create();
    app(AcceptGigOffer::class)->execute($client, $offer);
    app(SubmitGigAgreementTerms::class)->execute($client, $gig, ['final_scope' => 'Scope', 'work_date' => now()->addDay()->toDateString(), 'start_time' => '10:00', 'location_arrangement' => 'Lokasi', 'delivery_expectations' => 'Selesai', 'final_total_price' => 100_000]);
    app(AcceptGigAgreement::class)->execute($freelancer, $gig);
    $payment = GigPayment::query()->where('gig_id', $gig->id)->firstOrFail();
    app(MarkGigPaymentPaid::class)->execute($payment, $payment->local_reference, $payment->amount, now());

    return [$client, $freelancer, $gig];
}

test('client explicitly starts locked work', function () {
    [$client, , $gig] = lockedWorkflow();
    app(StartGig::class)->execute($client, $gig);
    expect($gig->refresh()->status)->toBe(GigStatus::InProgress)->and($gig->started_at)->not->toBeNull();
});

test('unilateral client exit records thirty seventy settlement', function () {
    [$client, , $gig] = lockedWorkflow();
    $request = app(RequestLockedGigExit::class)->execute($client, $gig, GigExitType::ClientCancellation, 'Batalkan');
    app(ProceedWithLockedGigExit::class)->execute($client, $request);
    expect($gig->refresh()->status)->toBe(GigStatus::Cancelled)
        ->and($gig->settlement->freelancer_payout)->toBe(30_000)
        ->and($gig->settlement->client_refund)->toBe(70_000);
});

test('agreed exits fully refund the client without an offense', function () {
    [$client, $freelancer, $gig] = lockedWorkflow();
    $request = app(RequestLockedGigExit::class)->execute($client, $gig, GigExitType::ClientCancellation, 'Batalkan bersama');
    app(RespondToLockedGigExit::class)->execute($freelancer, $request, GigExitDecision::Agree);

    expect($gig->refresh()->status)->toBe(GigStatus::Cancelled)
        ->and($gig->settlement->outcome)->toBe(GigSettlementOutcome::FullClientRefund)
        ->and(GigOffense::query()->count())->toBe(0);
});

test('freelancer unilateral abandonment records the 3 7 30 offense ladder', function () {
    mock(NotificationService::class)->shouldReceive('send')->zeroOrMoreTimes();
    $client = User::factory()->client()->create();
    $freelancer = User::factory()->freelancer()->create();

    foreach ([3, 7, 30] as $duration) {
        $gig = Gig::factory()->for($client, 'client')->create();
        $offer = GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->create();
        app(AcceptGigOffer::class)->execute($client, $offer);
        app(SubmitGigAgreementTerms::class)->execute($client, $gig, ['final_scope' => 'Scope', 'work_date' => now()->addDay()->toDateString(), 'start_time' => '10:00', 'location_arrangement' => 'Lokasi', 'delivery_expectations' => 'Selesai', 'final_total_price' => 100_000]);
        app(AcceptGigAgreement::class)->execute($freelancer, $gig);
        $payment = GigPayment::query()->where('gig_id', $gig->id)->firstOrFail();
        app(MarkGigPaymentPaid::class)->execute($payment, $payment->local_reference, $payment->amount, now());
        $request = app(RequestLockedGigExit::class)->execute($freelancer, $gig, GigExitType::FreelancerAbandonment, 'Tidak dapat melanjutkan');
        app(ProceedWithLockedGigExit::class)->execute($freelancer, $request);

        expect(GigOffense::query()->latest('id')->value('duration_days'))->toBe($duration);
    }

    expect(GigOffense::query()->where('user_id', $freelancer->id)->count())->toBe(3)
        ->and($freelancer->refresh()->bans()->count())->toBe(3)
        ->and($freelancer->activeBan)->not->toBeNull();
});

test('counterproof timeout settles no show and records an offense', function () {
    [$client, $freelancer, $gig] = lockedWorkflow();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');
    $dispute = app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Freelancer tidak hadir.', [UploadedFile::fake()->image('evidence.jpg')]);
    $dispute->update(['counterproof_due_at' => now()]);

    app(ExpireGigDisputeCounterproof::class)->execute($dispute);
    app(ExpireGigDisputeCounterproof::class)->execute($dispute);

    expect($gig->refresh()->status)->toBe(GigStatus::DisputeResolved)
        ->and($dispute->refresh()->status)->toBe(GigDisputeStatus::Resolved)
        ->and($gig->settlement->outcome)->toBe(GigSettlementOutcome::FullClientRefund)
        ->and(GigOffense::query()->where('user_id', $freelancer->id)->count())->toBe(1)
        ->and($gig->settlement()->count())->toBe(1);
});

test('counterproof at the deadline is rejected and uploaded evidence is rolled back on a failed report', function () {
    [$client, $freelancer, $gig] = lockedWorkflow();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');
    $dispute = app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Freelancer tidak hadir.', [UploadedFile::fake()->image('evidence.jpg')]);
    $dispute->update(['counterproof_due_at' => now()]);

    expect(fn () => app(SubmitGigDisputeCounterproof::class)->execute($freelancer, $dispute, 'Saya hadir.', [UploadedFile::fake()->image('counter.jpg')]))->toThrow(DomainException::class);
    expect(Storage::disk('cos-private')->allFiles())->toHaveCount(1);
    [$otherClient, $otherFreelancer, $otherGig] = lockedWorkflow();
    $otherGig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    expect(fn () => app(OpenGigDispute::class)->execute($otherFreelancer, $otherGig, GigDisputeType::NoShow, 'Jenis tidak sesuai.', [UploadedFile::fake()->image('bad.jpg')]))->toThrow(AuthorizationException::class);
    expect(Storage::disk('cos-private')->allFiles())->toHaveCount(1)
        ->and(GigDisputeMedia::query()->count())->toBe(1);
});

test('admin client-at-fault resolution punishes the client, not the reporter role', function () {
    mock(NotificationService::class)->shouldReceive('send')->zeroOrMoreTimes();
    [$client, $freelancer, $gig] = lockedWorkflow();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');
    $dispute = app(OpenGigDispute::class)->execute($freelancer, $gig, GigDisputeType::StartBlocked, 'Klien menghalangi mulai.', [UploadedFile::fake()->image('report.jpg')]);
    app(SubmitGigDisputeCounterproof::class)->execute($client, $dispute, 'Tanggapan klien.', [UploadedFile::fake()->image('response.jpg')]);
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    app(ResolveGigDispute::class)->execute($admin, $dispute, GigDisputeFinding::ClientAtFault, null, 'Klien terbukti menghalangi pekerjaan.');

    expect($gig->refresh()->settlement->outcome)->toBe(GigSettlementOutcome::ThirtySeventy)
        ->and(GigOffense::query()->where('user_id', $client->id)->exists())->toBeTrue()
        ->and(GigOffense::query()->where('user_id', $freelancer->id)->exists())->toBeFalse();
});

test('a permanent manual ban is preserved while a gig offense is recorded', function () {
    [$client, $freelancer, $gig] = lockedWorkflow();
    $manualBan = UserBan::query()->create(['user_id' => $freelancer->id, 'reason' => 'Manual permanent ban', 'banned_at' => now(), 'banned_until' => null]);
    $request = app(RequestLockedGigExit::class)->execute($freelancer, $gig, GigExitType::FreelancerAbandonment, 'Tidak dapat melanjutkan');
    app(ProceedWithLockedGigExit::class)->execute($freelancer, $request);

    expect(GigOffense::query()->sole()->user_ban_id)->toBeNull()
        ->and($freelancer->refresh()->activeBan->id)->toBe($manualBan->id);
});
