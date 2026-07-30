<?php

use App\Actions\Agreement\AcceptGigAgreement;
use App\Actions\Agreement\SubmitGigAgreementTerms;
use App\Actions\Dispute\OpenGigDispute;
use App\Actions\Dispute\SubmitGigDisputeCounterproof;
use App\Actions\Gig\AcceptGigOffer;
use App\Actions\Payment\MarkGigPaymentPaid;
use App\Actions\Workflow\RejectGigFinishRequest;
use App\Actions\Workflow\RequestLockedGigExit;
use App\Actions\Workflow\StartGig;
use App\Actions\Workflow\SubmitGigFinishRequest;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Enums\GigFinishRequestStatus;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigExitRequest;
use App\Models\GigMessage;
use App\Models\GigMessageMedia;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

use function Pest\Laravel\mock;

function requireMariaDbRaceDatabase(): void
{
    if (config('database.default') !== 'mariadb') {
        test()->markTestSkipped('MariaDB race acceptance only runs with DB_CONNECTION=mariadb.');
    }
}

function raceLockedGig(): array
{
    mock(NotificationService::class)->shouldReceive('send')->zeroOrMoreTimes();
    Storage::fake('cos-private');
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
        'final_total_price' => 100_000,
    ]);
    app(AcceptGigAgreement::class)->execute($freelancer, $gig);
    $payment = GigPayment::query()->where('gig_id', $gig->id)->sole();
    app(MarkGigPaymentPaid::class)->execute($payment, $payment->local_reference, $payment->amount, now());

    return [$client->id, $freelancer->id, $gig->id];
}

function raceInProgressGig(): array
{
    [$clientId, $freelancerId, $gigId] = raceLockedGig();
    app(StartGig::class)->execute(
        User::query()->findOrFail($clientId),
        Gig::query()->findOrFail($gigId),
    );

    return [$clientId, $freelancerId, $gigId];
}

/** @param list<string> $workers */
function raceWorkers(array $workers): array
{
    $releaseAt = microtime(true) + 0.5;
    $processes = [];

    foreach ($workers as $worker) {
        $code = <<<'PHP'
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
Illuminate\Support\Facades\Storage::fake('cos-private');
PHP;
        $code .= "\nwhile (microtime(true) < {$releaseAt}) { usleep(1000); }\ntry { {$worker} } catch (\\DomainException) {}";
        $process = new Process([PHP_BINARY, '-r', $code], base_path());
        $process->start();
        $processes[] = $process;
    }

    $results = [];
    foreach ($processes as $process) {
        $process->wait();
        $results[] = $process->isSuccessful() ? 'ok' : $process->getOutput().$process->getErrorOutput();
    }

    if (count(array_filter($results, fn (string $result): bool => $result !== 'ok')) > 0) {
        throw new RuntimeException(implode("\n", $results));
    }

    return $results;
}

test('MariaDB serializes start versus a locked exit request', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceLockedGig();

    raceWorkers([
        "app(\\App\\Actions\\Workflow\\StartGig::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\Gig::query()->findOrFail({$gigId}));",
        "app(\\App\\Actions\\Workflow\\RequestLockedGigExit::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\Gig::query()->findOrFail({$gigId}), \\App\\Enums\\GigExitType::FreelancerAbandonment, 'Tidak dapat lanjut');",
    ]);

    $gig = Gig::query()->findOrFail($gigId);
    expect($gig->status)->toBeIn([GigStatus::InProgress, GigStatus::Locked])
        ->and($gig->exitRequests()->active()->count())->toBe($gig->status === GigStatus::Locked ? 1 : 0);
});

test('MariaDB serializes response versus withdrawal and unilateral exit', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceLockedGig();
    $request = app(RequestLockedGigExit::class)->execute(User::query()->findOrFail($clientId), Gig::query()->findOrFail($gigId), GigExitType::ClientCancellation, 'Batalkan');

    raceWorkers([
        "app(\\App\\Actions\\Workflow\\RespondToLockedGigExit::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\GigExitRequest::query()->findOrFail({$request->id}), \\App\\Enums\\GigExitDecision::Agree);",
        "app(\\App\\Actions\\Workflow\\WithdrawLockedGigExit::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigExitRequest::query()->findOrFail({$request->id}));",
        "app(\\App\\Actions\\Workflow\\ProceedWithLockedGigExit::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigExitRequest::query()->findOrFail({$request->id}));",
    ]);

    $gig = Gig::query()->findOrFail($gigId);
    $status = GigExitRequest::query()->findOrFail($request->id)->status;
    expect($status)->toBeIn([GigExitStatus::Executed, GigExitStatus::Withdrawn])
        ->and($gig->status)->toBe($status === GigExitStatus::Executed ? GigStatus::Cancelled : GigStatus::Locked)
        ->and($gig->settlement()->count())->toBe($status === GigExitStatus::Executed ? 1 : 0);
});

test('MariaDB serializes counterproof versus counterproof expiry', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceLockedGig();
    Gig::query()->findOrFail($gigId)->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    $dispute = app(OpenGigDispute::class)->execute(User::query()->findOrFail($clientId), Gig::query()->findOrFail($gigId), GigDisputeType::NoShow, 'Tidak hadir', [UploadedFile::fake()->image('report.jpg')]);
    $dispute->update(['counterproof_due_at' => now()->addSecond()]);

    raceWorkers([
        "app(\\App\\Actions\\Dispute\\SubmitGigDisputeCounterproof::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\GigDispute::query()->findOrFail({$dispute->id}), 'Saya hadir.', [\\Illuminate\\Http\\UploadedFile::fake()->image('counter.jpg')]);",
        "usleep(1100000); app(\\App\\Actions\\Dispute\\ExpireGigDisputeCounterproof::class)->execute(\\App\\Models\\GigDispute::query()->findOrFail({$dispute->id}));",
    ]);

    $fresh = $dispute->fresh();
    expect($fresh->status)->toBeIn([GigDisputeStatus::AwaitingAdmin, GigDisputeStatus::Resolved])
        ->and($fresh->submissions()->where('type', 'counterproof')->count())->toBeLessThanOrEqual(1)
        ->and($fresh->settlement()->count())->toBeLessThanOrEqual(1);
});

test('MariaDB allows one admin resolution and one settlement', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceLockedGig();
    Gig::query()->findOrFail($gigId)->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    $dispute = app(OpenGigDispute::class)->execute(User::query()->findOrFail($clientId), Gig::query()->findOrFail($gigId), GigDisputeType::NoShow, 'Tidak hadir', [UploadedFile::fake()->image('report.jpg')]);
    app(SubmitGigDisputeCounterproof::class)->execute(User::query()->findOrFail($freelancerId), $dispute, 'Saya hadir.', [UploadedFile::fake()->image('counter.jpg')]);
    $firstAdmin = User::factory()->create(['role' => UserRole::Admin]);
    $secondAdmin = User::factory()->create(['role' => UserRole::Admin]);

    raceWorkers([
        "app(\\App\\Actions\\Dispute\\ResolveGigDispute::class)->execute(\\App\\Models\\User::query()->findOrFail({$firstAdmin->id}), \\App\\Models\\GigDispute::query()->findOrFail({$dispute->id}), \\App\\Enums\\GigDisputeFinding::FreelancerAtFault, null, 'Keputusan pertama.');",
        "app(\\App\\Actions\\Dispute\\ResolveGigDispute::class)->execute(\\App\\Models\\User::query()->findOrFail({$secondAdmin->id}), \\App\\Models\\GigDispute::query()->findOrFail({$dispute->id}), \\App\\Enums\\GigDisputeFinding::FreelancerAtFault, null, 'Keputusan kedua.');",
    ]);

    expect($dispute->fresh()->status)->toBe(GigDisputeStatus::Resolved)
        ->and(Gig::query()->findOrFail($gigId)->settlement()->count())->toBe(1)
        ->and(User::query()->findOrFail($freelancerId)->gigOffenses()->count())->toBe(1);
});

test('MariaDB assigns distinct offense ladder steps under concurrent offenses', function () {
    requireMariaDbRaceDatabase();
    $user = User::factory()->freelancer()->create();
    $firstGig = Gig::factory()->create();
    $secondGig = Gig::factory()->create();
    $first = GigExitRequest::factory()->for($firstGig)->create();
    $second = GigExitRequest::factory()->for($secondGig)->create();

    raceWorkers([
        "\\Illuminate\\Support\\Facades\\DB::transaction(function (): void { \$user = \\App\\Models\\User::query()->lockForUpdate()->findOrFail({$user->id}); app(\\App\\Services\\GigOffenseService::class)->record(\$user, \\App\\Models\\Gig::query()->findOrFail({$firstGig->id}), \\App\\Models\\GigExitRequest::query()->findOrFail({$first->id})); }, attempts: 3);",
        "\\Illuminate\\Support\\Facades\\DB::transaction(function (): void { \$user = \\App\\Models\\User::query()->lockForUpdate()->findOrFail({$user->id}); app(\\App\\Services\\GigOffenseService::class)->record(\$user, \\App\\Models\\Gig::query()->findOrFail({$secondGig->id}), \\App\\Models\\GigExitRequest::query()->findOrFail({$second->id})); }, attempts: 3);",
    ]);

    expect(User::query()->findOrFail($user->id)->gigOffenses()->pluck('sequence')->sort()->values()->all())->toBe([1, 2]);
});

test('MariaDB serializes finish submission versus work obstruction', function () {
    requireMariaDbRaceDatabase();
    [, $freelancerId, $gigId] = raceInProgressGig();

    raceWorkers([
        "app(\\App\\Actions\\Workflow\\SubmitGigFinishRequest::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\Gig::query()->findOrFail({$gigId}), 'Pekerjaan selesai.', [\\Illuminate\\Http\\UploadedFile::fake()->image('finish.jpg')]);",
        "app(\\App\\Actions\\Dispute\\OpenGigDispute::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\Gig::query()->findOrFail({$gigId}), \\App\\Enums\\GigDisputeType::WorkObstruction, 'Klien menghalangi.', [\\Illuminate\\Http\\UploadedFile::fake()->image('obstruction.jpg')]);",
    ]);

    $gig = Gig::query()->findOrFail($gigId);
    expect($gig->status)->toBeIn([GigStatus::Review, GigStatus::Disputed])
        ->and($gig->finishRequests()->pending()->count())->toBe($gig->status === GigStatus::Review ? 1 : 0)
        ->and($gig->dispute()->count())->toBe($gig->status === GigStatus::Disputed ? 1 : 0);
});

test('MariaDB serializes accept reject and automatic completion', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceInProgressGig();
    $request = app(SubmitGigFinishRequest::class)->execute(
        User::query()->findOrFail($freelancerId),
        Gig::query()->findOrFail($gigId),
        'Pekerjaan selesai.',
        [UploadedFile::fake()->image('finish.jpg')],
    );
    $request->update(['review_due_at' => now()->addMilliseconds(600)]);

    raceWorkers([
        "app(\\App\\Actions\\Workflow\\AcceptGigFinishRequest::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigFinishRequest::query()->findOrFail({$request->id}));",
        "app(\\App\\Actions\\Workflow\\RejectGigFinishRequest::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigFinishRequest::query()->findOrFail({$request->id}), 'Belum sesuai.');",
        "usleep(150000); app(\\App\\Actions\\Workflow\\AutoAcceptGigFinishRequest::class)->execute(\\App\\Models\\GigFinishRequest::query()->findOrFail({$request->id}));",
    ]);

    $request = $request->fresh();
    $gig = Gig::query()->findOrFail($gigId);
    expect($request->status)->toBeIn([
        GigFinishRequestStatus::Accepted,
        GigFinishRequestStatus::Rejected,
        GigFinishRequestStatus::AutoAccepted,
    ])->and($gig->settlement()->count())->toBeIn([0, 1])
        ->and($gig->settlement()->count())->toBe($request->status === GigFinishRequestStatus::Rejected ? 0 : 1)
        ->and($gig->status)->toBe($request->status === GigFinishRequestStatus::Rejected ? GigStatus::InProgress : GigStatus::Completed);
});

test('MariaDB serializes finish resubmission versus latest rejection dispute', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceInProgressGig();
    $request = app(SubmitGigFinishRequest::class)->execute(
        User::query()->findOrFail($freelancerId),
        Gig::query()->findOrFail($gigId),
        'Pekerjaan pertama.',
        [UploadedFile::fake()->image('first.jpg')],
    );
    app(RejectGigFinishRequest::class)->execute(
        User::query()->findOrFail($clientId),
        $request,
        'Belum sesuai.',
    );

    raceWorkers([
        "app(\\App\\Actions\\Workflow\\SubmitGigFinishRequest::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\Gig::query()->findOrFail({$gigId}), 'Pekerjaan diperbaiki.', [\\Illuminate\\Http\\UploadedFile::fake()->image('second.jpg')]);",
        "app(\\App\\Actions\\Dispute\\OpenGigDispute::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\Gig::query()->findOrFail({$gigId}), \\App\\Enums\\GigDisputeType::FinishRejected, 'Penolakan tidak sesuai.', []);",
    ]);

    $gig = Gig::query()->findOrFail($gigId);
    expect($gig->status)->toBeIn([GigStatus::Review, GigStatus::Disputed])
        ->and($gig->finishRequests()->pending()->count())->toBe($gig->status === GigStatus::Review ? 1 : 0)
        ->and($gig->dispute()->count())->toBe($gig->status === GigStatus::Disputed ? 1 : 0);
});

test('MariaDB creates one settlement for duplicate completion acceptance', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceInProgressGig();
    $request = app(SubmitGigFinishRequest::class)->execute(
        User::query()->findOrFail($freelancerId),
        Gig::query()->findOrFail($gigId),
        'Pekerjaan selesai.',
        [UploadedFile::fake()->image('finish.jpg')],
    );

    raceWorkers([
        "app(\\App\\Actions\\Workflow\\AcceptGigFinishRequest::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigFinishRequest::query()->findOrFail({$request->id}));",
        "app(\\App\\Actions\\Workflow\\AcceptGigFinishRequest::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigFinishRequest::query()->findOrFail({$request->id}));",
    ]);

    expect($request->fresh()->status)->toBe(GigFinishRequestStatus::Accepted)
        ->and(Gig::query()->findOrFail($gigId)->settlement()->count())->toBe(1);
});

test('MariaDB serializes post-start counterproof versus expiry', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceInProgressGig();
    $dispute = app(OpenGigDispute::class)->execute(
        User::query()->findOrFail($freelancerId),
        Gig::query()->findOrFail($gigId),
        GigDisputeType::WorkObstruction,
        'Klien menghalangi.',
        [UploadedFile::fake()->image('report.jpg')],
    );
    $dispute->update(['counterproof_due_at' => now()->addSecond()]);

    raceWorkers([
        "app(\\App\\Actions\\Dispute\\SubmitGigDisputeCounterproof::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigDispute::query()->findOrFail({$dispute->id}), 'Saya tidak menghalangi.', [\\Illuminate\\Http\\UploadedFile::fake()->image('counter.jpg')]);",
        "usleep(1100000); app(\\App\\Actions\\Dispute\\ExpireGigDisputeCounterproof::class)->execute(\\App\\Models\\GigDispute::query()->findOrFail({$dispute->id}));",
    ]);

    $fresh = $dispute->fresh();
    expect($fresh->status)->toBeIn([GigDisputeStatus::AwaitingAdmin, GigDisputeStatus::Resolved])
        ->and($fresh->submissions()->where('type', 'counterproof')->count())->toBeLessThanOrEqual(1)
        ->and($fresh->settlement()->count())->toBeLessThanOrEqual(1);
});

test('MariaDB allows both participants to send concurrently without duplicate system cards', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceLockedGig();
    $agreementId = Gig::query()->findOrFail($gigId)->currentAgreement->id;

    raceWorkers([
        "app(\\App\\Actions\\Gig\\SendGigMessage::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigAgreement::query()->findOrFail({$agreementId}), 'Pesan klien', []);",
        "app(\\App\\Actions\\Gig\\SendGigMessage::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\GigAgreement::query()->findOrFail({$agreementId}), 'Pesan freelancer', []);",
    ]);

    expect(GigMessage::query()
        ->where('gig_agreement_id', $agreementId)
        ->where('kind', 'user')
        ->count())->toBe(2)
        ->and(GigMessage::query()
            ->where('gig_agreement_id', $agreementId)
            ->where('event_key', "agreement:{$agreementId}:selected")
            ->count())->toBe(1);
});

test('MariaDB serializes message sending versus dispute opening', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceLockedGig();
    $gig = Gig::query()->findOrFail($gigId);
    $agreementId = $gig->currentAgreement->id;
    $gig->currentAgreement->update([
        'work_date' => now()->subDay()->toDateString(),
        'start_time' => '10:00',
    ]);

    raceWorkers([
        "app(\\App\\Actions\\Gig\\SendGigMessage::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigAgreement::query()->findOrFail({$agreementId}), 'Apakah sudah hadir?', [\\Illuminate\\Http\\UploadedFile::fake()->image('context.jpg')]);",
        "app(\\App\\Actions\\Dispute\\OpenGigDispute::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\Gig::query()->findOrFail({$gigId}), \\App\\Enums\\GigDisputeType::NoShow, 'Tidak hadir', [\\Illuminate\\Http\\UploadedFile::fake()->image('report.jpg')]);",
    ]);

    expect($gig->fresh()->status)->toBe(GigStatus::Disputed)
        ->and(GigMessage::query()
            ->where('gig_agreement_id', $agreementId)
            ->where('body', 'Apakah sudah hadir?')
            ->count())->toBeLessThanOrEqual(1)
        ->and(Storage::disk('cos-private')->allFiles('gig-messages'))->toHaveCount(
            GigMessageMedia::query()->count(),
        )
        ->and(GigMessage::query()
            ->where('gig_agreement_id', $agreementId)
            ->where('workflow_event', 'dispute_opened')
            ->count())->toBe(1);
});

test('MariaDB serializes message sending versus gig completion', function () {
    requireMariaDbRaceDatabase();
    [$clientId, $freelancerId, $gigId] = raceInProgressGig();
    $finish = app(SubmitGigFinishRequest::class)->execute(
        User::query()->findOrFail($freelancerId),
        Gig::query()->findOrFail($gigId),
        'Pekerjaan selesai.',
        [UploadedFile::fake()->image('finish.jpg')],
    );
    $agreementId = Gig::query()->findOrFail($gigId)->currentAgreement->id;

    raceWorkers([
        "app(\\App\\Actions\\Gig\\SendGigMessage::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancerId}), \\App\\Models\\GigAgreement::query()->findOrFail({$agreementId}), 'Mohon ditinjau', []);",
        "app(\\App\\Actions\\Workflow\\AcceptGigFinishRequest::class)->execute(\\App\\Models\\User::query()->findOrFail({$clientId}), \\App\\Models\\GigFinishRequest::query()->findOrFail({$finish->id}));",
    ]);

    expect(Gig::query()->findOrFail($gigId)->status)->toBe(GigStatus::Completed)
        ->and(GigMessage::query()
            ->where('gig_agreement_id', $agreementId)
            ->where('body', 'Mohon ditinjau')
            ->count())->toBeLessThanOrEqual(1)
        ->and(GigMessage::query()
            ->where('gig_agreement_id', $agreementId)
            ->where('workflow_event', 'gig_completed')
            ->count())->toBe(1);
});

test('MariaDB deduplicates simultaneous workflow event recording', function () {
    requireMariaDbRaceDatabase();
    [, , $gigId] = raceLockedGig();
    $agreementId = Gig::query()->findOrFail($gigId)->currentAgreement->id;
    $key = "agreement:{$agreementId}:race-event";

    raceWorkers([
        "app(\\App\\Services\\GigConversationService::class)->record(\\App\\Models\\GigAgreement::query()->findOrFail({$agreementId}), \\App\\Enums\\GigWorkflowEvent::WorkStarted, '{$key}');",
        "app(\\App\\Services\\GigConversationService::class)->record(\\App\\Models\\GigAgreement::query()->findOrFail({$agreementId}), \\App\\Enums\\GigWorkflowEvent::WorkStarted, '{$key}');",
    ]);

    expect(GigMessage::query()
        ->where('gig_agreement_id', $agreementId)
        ->where('event_key', $key)
        ->count())->toBe(1);
});
