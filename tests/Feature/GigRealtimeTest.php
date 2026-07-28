<?php

use App\Enums\GigDiscoveryChange;
use App\Enums\GigRealtimeChange;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Events\GigDiscoveryChanged;
use App\Events\GigStateChanged;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigDispute;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Models\UserBan;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Broadcast;

uses(LazilyRefreshDatabase::class);

test('realtime events expose only compact safe payloads', function () {
    $discovery = new GigDiscoveryChanged(
        42,
        GigDiscoveryChange::ApplicantCount,
        true,
        3,
        '2026-07-28T12:00:00+00:00',
    );
    $state = new GigStateChanged(
        42,
        GigRealtimeChange::Offer,
        GigStatus::Open,
        [7, 7, 9],
        '2026-07-28T12:00:00+00:00',
    );

    expect($discovery)->toBeInstanceOf(ShouldBroadcast::class)
        ->toBeInstanceOf(ShouldDispatchAfterCommit::class)
        ->toBeInstanceOf(ShouldRescue::class)
        ->and($discovery->broadcastAs())->toBe('gig.discovery.changed')
        ->and($discovery->broadcastOn()[0]->name)->toBe('private-gigs.discovery')
        ->and($discovery->broadcastWith())->toBe([
            'gig_id' => 42,
            'change' => 'applicant_count',
            'discoverable' => true,
            'pending_applicants_count' => 3,
            'occurred_at' => '2026-07-28T12:00:00+00:00',
        ])
        ->and($state->broadcastAs())->toBe('gig.state.changed')
        ->and(array_column($state->broadcastOn(), 'name'))->toBe([
            'private-App.Models.User.7',
            'private-App.Models.User.9',
        ])
        ->and($state->broadcastWith())->toBe([
            'gig_id' => 42,
            'change' => 'offer',
            'status' => 'open',
            'occurred_at' => '2026-07-28T12:00:00+00:00',
        ]);
});

test('discovery channel accepts only eligible freelancers', function () {
    $eligible = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $admin = User::factory()->create(['role' => UserRole::Admin, 'onboarding_step' => null]);
    $incomplete = User::factory()->freelancer()->create(['onboarding_step' => 'profile']);
    $banned = User::factory()->freelancer()->create(['onboarding_step' => null]);
    UserBan::query()->create([
        'user_id' => $banned->id,
        'reason' => 'test',
        'banned_at' => now(),
        'banned_until' => now()->addDay(),
    ]);
    $authorize = Broadcast::getChannels()->get('gigs.discovery');

    expect($authorize($eligible))->toBeTrue()
        ->and($authorize($client))->toBeFalse()
        ->and($authorize($admin))->toBeFalse()
        ->and($authorize($incomplete))->toBeFalse()
        ->and($authorize($banned))->toBeFalse();
});

test('gig destination follows the current phase for participants', function (
    GigStatus $status,
    string $routeName,
) {
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create(['status' => $status]);
    $offer = GigOffer::factory()
        ->for($gig)
        ->for($freelancer, 'freelancer')
        ->accepted()
        ->create();
    GigAgreement::factory()
        ->for($gig)
        ->for($offer, 'acceptedOffer')
        ->create();

    $this->actingAs($client)
        ->get(route('app.gigs.destination', $gig))
        ->assertRedirect(route($routeName, $gig));
})->with([
    'open' => [GigStatus::Open, 'app.gigs.show'],
    'agreement preparation' => [GigStatus::AgreementPreparation, 'app.gigs.agreement.show'],
    'lock pending' => [GigStatus::LockPending, 'app.gigs.agreement.show'],
    'payment pending' => [GigStatus::PaymentPending, 'app.gigs.payment.show'],
    'locked' => [GigStatus::Locked, 'app.gigs.workflow.show'],
    'in progress' => [GigStatus::InProgress, 'app.gigs.workflow.show'],
    'review' => [GigStatus::Review, 'app.gigs.workflow.show'],
    'completed' => [GigStatus::Completed, 'app.history.show'],
    'cancelled' => [GigStatus::Cancelled, 'app.history.show'],
    'dispute resolved' => [GigStatus::DisputeResolved, 'app.history.show'],
]);

test('gig destination resolves an active dispute for either participant', function () {
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create(['status' => GigStatus::Disputed]);
    $offer = GigOffer::factory()
        ->for($gig)
        ->for($freelancer, 'freelancer')
        ->accepted()
        ->create();
    $agreement = GigAgreement::factory()
        ->for($gig)
        ->for($offer, 'acceptedOffer')
        ->confirmed()
        ->create();
    $payment = GigPayment::factory()
        ->for($gig)
        ->for($agreement, 'agreement')
        ->paid()
        ->create();
    $dispute = GigDispute::factory()
        ->for($gig)
        ->for($agreement, 'agreement')
        ->for($payment, 'payment')
        ->for($client, 'reporter')
        ->for($freelancer, 'respondent')
        ->create();

    $this->actingAs($freelancer)
        ->get(route('app.gigs.destination', $gig))
        ->assertRedirect(route('app.gig_disputes.show', $dispute));
});

test('gig destination keeps non-selected applicants on the safe detail page', function () {
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $selected = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $applicant = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create(['status' => GigStatus::Cancelled]);
    $selectedOffer = GigOffer::factory()
        ->for($gig)
        ->for($selected, 'freelancer')
        ->accepted()
        ->create();
    GigOffer::factory()
        ->for($gig)
        ->for($applicant, 'freelancer')
        ->autoWithdrawn()
        ->create();
    GigAgreement::factory()
        ->for($gig)
        ->for($selectedOffer, 'acceptedOffer')
        ->create();

    $this->actingAs($applicant)
        ->get(route('app.gigs.destination', $gig))
        ->assertRedirect(route('app.gigs.show', $gig));
});

test('gig destination rejects unrelated users and redirects suspended users', function () {
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $unrelated = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()
        ->for($client, 'client')
        ->create(['status' => GigStatus::Cancelled]);

    $this->actingAs($unrelated)
        ->get(route('app.gigs.destination', $gig))
        ->assertNotFound();

    UserBan::query()->create([
        'user_id' => $client->id,
        'reason' => 'test',
        'banned_at' => now(),
        'banned_until' => now()->addDay(),
    ]);

    $this->actingAs($client)
        ->get(route('app.gigs.destination', $gig))
        ->assertRedirect(route('app.suspension'));
});
