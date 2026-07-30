<?php

use App\Actions\Dispute\ResolveGigDispute;
use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigDispute;
use App\Models\GigDisputeSubmission;
use App\Models\GigExitRequest;
use App\Models\GigOffense;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\GigRating;
use App\Models\GigSettlement;
use App\Models\User;
use App\Models\UserBan;
use App\Services\HomeService;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoSeeder;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\NullOutput;

uses(RefreshDatabase::class);

test('normal seed creates realistic terminal history without pending work', function () {
    $this->seed(DatabaseSeeder::class);

    expect(User::query()->count())->toBe(9)
        ->and(Gig::query()->count())->toBe(8)
        ->and(Gig::query()->where('status', GigStatus::Completed)->count())->toBe(5)
        ->and(Gig::query()->where('status', GigStatus::Cancelled)->count())->toBe(2)
        ->and(Gig::query()->where('status', GigStatus::DisputeResolved)->count())->toBe(1)
        ->and(Gig::query()->whereNotIn('status', [
            GigStatus::Completed,
            GigStatus::Cancelled,
            GigStatus::DisputeResolved,
        ])->count())->toBe(0)
        ->and(GigOffer::query()->where('status', GigOfferStatus::PENDING)->count())->toBe(0)
        ->and(GigPayment::query()->where('status', GigPaymentStatus::Pending)->count())->toBe(0)
        ->and(GigDispute::query()->whereIn('status', [
            GigDisputeStatus::AwaitingCounterproof,
            GigDisputeStatus::AwaitingAdmin,
        ])->count())->toBe(0)
        ->and(UserBan::query()->active()->count())->toBe(0)
        ->and(GigRating::query()->count())->toBe(12);

    expect(Gig::query()->whereNull('estimated_duration')->count())->toBe(0)
        ->and(Gig::query()->whereNull('wage_benchmark_minimum')->count())->toBe(0)
        ->and(GigAgreement::query()->whereNull('estimated_duration')->count())->toBe(0)
        ->and(GigAgreement::query()->whereNull('wage_benchmark_minimum')->count())->toBe(0);

    $freelancer = User::query()->where('email', 'freelancer@example.com')->firstOrFail();
    $client = User::query()->where('email', 'client@example.com')->firstOrFail();

    expect($freelancer->freelancerProfile)->not->toBeNull()
        ->and($freelancer->avatar)->toBe('database/seeders/assets/avatars/main/freelancer.webp')
        ->and($client->avatar)->toBe('database/seeders/assets/avatars/main/client.webp')
        ->and(Hash::check('password', $client->password))->toBeTrue();

    $clientHome = app(HomeService::class)->for($client);
    $freelancerHome = app(HomeService::class)->for($freelancer);

    expect($clientHome['summary']['active_gigs'])->toBe(0)
        ->and($clientHome['summary']['pending_ratings'])->toBe(0)
        ->and($clientHome['actions'])->toBe([])
        ->and($clientHome['rating_reminders'])->toBe([])
        ->and($freelancerHome['summary']['active_applications'])->toBe(0)
        ->and($freelancerHome['actions'])->toBe([]);
});

test('normal seed may be run twice without duplicating history', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(User::query()->count())->toBe(9)
        ->and(Gig::query()->count())->toBe(8)
        ->and(GigRating::query()->count())->toBe(12);
});

test('demo seed creates one decision-ready work obstruction dispute', function () {
    $this->seed(DemoSeeder::class);

    $dispute = GigDispute::query()
        ->where('status', GigDisputeStatus::AwaitingAdmin)
        ->where('type', GigDisputeType::WorkObstruction)
        ->with(['gig', 'agreement.messages', 'submissions.media'])
        ->sole();

    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $client = User::query()->where('email', 'client@example.com')->firstOrFail();
    $freelancer = User::query()->where('email', 'freelancer@example.com')->firstOrFail();

    expect($dispute->gig->status)->toBe(GigStatus::Disputed)
        ->and($dispute->reporter_id)->toBe($freelancer->id)
        ->and($dispute->respondent_id)->toBe($client->id)
        ->and($dispute->submissions)->toHaveCount(2)
        ->and($dispute->submissions->sum(fn (GigDisputeSubmission $submission): int => $submission->media->count()))->toBe(4)
        ->and($dispute->agreement->messages)->toHaveCount(20)
        ->and($dispute->agreement->messages->whereNull('read_at')->whereNotNull('recipient_id'))->toHaveCount(2)
        ->and($dispute->aiOverview)->toBeNull()
        ->and(GigSettlement::query()->where('gig_id', $dispute->gig_id)->exists())->toBeFalse()
        ->and(GigOffense::query()->where('gig_id', $dispute->gig_id)->exists())->toBeFalse();

    $adminHome = app(HomeService::class)->for($admin);
    expect($adminHome['summary']['awaiting_admin'])->toBe(1)
        ->and(collect($adminHome['actions'])->pluck('target.id')->contains($dispute->id))->toBeTrue();

    app(ResolveGigDispute::class)->execute(
        $admin,
        $dispute,
        GigDisputeFinding::ClientAtFault,
        null,
        'Bukti menunjukkan area kerja tidak disiapkan sesuai kesepakatan.',
    );

    expect($dispute->refresh()->status)->toBe(GigDisputeStatus::Resolved)
        ->and($dispute->gig->refresh()->status)->toBe(GigStatus::DisputeResolved)
        ->and($dispute->gig->settlement->freelancer_payout)->toBe(400_000)
        ->and($dispute->gig->offenses()->where('user_id', $client->id)->exists())->toBeTrue();
});

test('demo seed may be run twice without duplicating its active scenario', function () {
    $this->seed(DemoSeeder::class);
    $this->seed(DemoSeeder::class);

    expect(Gig::query()->where('title', 'Pindahkan dan Tata Ulang Rak Toko')->count())->toBe(1)
        ->and(GigDispute::query()->where('status', GigDisputeStatus::AwaitingAdmin)->count())->toBe(1);
});

test('relationship factories create internally consistent graphs', function () {
    $agreement = GigAgreement::factory()->create();
    expect($agreement->acceptedOffer->gig_id)->toBe($agreement->gig_id);

    $dispute = GigDispute::factory()->create();
    expect($dispute->payment->gig_id)->toBe($dispute->gig_id)
        ->and($dispute->payment->gig_agreement_id)->toBe($dispute->gig_agreement_id)
        ->and($dispute->reporter_id)->toBe($dispute->gig->client_id)
        ->and($dispute->respondent_id)->toBe($dispute->agreement->acceptedOffer->freelancer_id);

    $submission = GigDisputeSubmission::factory()->create(['gig_dispute_id' => $dispute->id]);
    expect($submission->submitted_by)->toBe($dispute->reporter_id);

    $counterproof = GigDisputeSubmission::factory()
        ->counterproof()
        ->create(['gig_dispute_id' => GigDispute::factory()->create()->id]);
    expect($counterproof->submitted_by)->toBe($counterproof->dispute->respondent_id);

    $exit = GigExitRequest::factory()->create();
    expect($exit->requester_id)->toBe($exit->gig->client_id)
        ->and($exit->responder_id)->toBe($exit->gig->acceptedOffer->freelancer_id);

    $rating = GigRating::factory()->create();
    expect($rating->rater_id)->toBe($rating->gig->client_id)
        ->and($rating->recipient_id)->toBe($rating->gig->acceptedOffer->freelancer_id);

    $settlement = GigSettlement::factory()->create();
    expect($settlement->gig_id)->toBe($settlement->payment->gig_id)
        ->and($settlement->total_amount)->toBe($settlement->payment->amount)
        ->and($settlement->client_refund)->toBe($settlement->payment->amount);

    $offense = GigOffense::factory()->create();
    expect($offense->user_id)->toBe($offense->gig->acceptedOffer->freelancer_id);
});

test('fresh migration cleanup preserves seed assets only', function () {
    Storage::disk('cos')->put('database/seeders/assets/avatars/main/client.webp', 'seed avatar');
    Storage::disk('cos')->put('avatars/user-upload.webp', 'user avatar');
    Storage::disk('cos')->put('gigs/user-upload.webp', 'user gig');
    Storage::disk('cos-private')->put('gig-messages/user-upload.webp', 'private chat');
    Storage::disk('cos-private')->put('gig-workflow/user-upload.webp', 'private evidence');

    app()->detectEnvironment(fn (): string => 'local');

    try {
        event(new CommandStarting('migrate:fresh', new ArrayInput([]), new NullOutput));
    } finally {
        app()->detectEnvironment(fn (): string => 'testing');
    }

    Storage::disk('cos')->assertExists([
        'database/seeders/assets/avatars/main/client.webp',
    ]);
    Storage::disk('cos')->assertMissing([
        'avatars/user-upload.webp',
        'gigs/user-upload.webp',
    ]);
    Storage::disk('cos-private')->assertMissing([
        'gig-messages/user-upload.webp',
        'gig-workflow/user-upload.webp',
    ]);
});
