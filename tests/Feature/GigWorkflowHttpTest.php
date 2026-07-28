<?php

use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Enums\OnboardingStep;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\User;
use App\Models\UserBan;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Route;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

function gigWorkflowUser(UserRole $role): User
{
    return match ($role) {
        UserRole::Freelancer => User::factory()->freelancer()->create(['onboarding_step' => null]),
        UserRole::Client => User::factory()->client()->create(['onboarding_step' => null]),
        default => User::factory()->create(['role' => $role, 'onboarding_step' => null]),
    };
}

function gigWorkflowOffer(User $client, ?User $freelancer = null): GigOffer
{
    return GigOffer::factory()
        ->for(Gig::factory()->for($client, 'client'))
        ->for($freelancer ?? gigWorkflowUser(UserRole::Freelancer), 'freelancer')
        ->create();
}

test('gig workflow routes retain their names verbs and bound parameters', function () {
    expect(Route::getRoutes()->getByName('app.gigs.offers.store')->uri())->toBe('app/gigs/{gig}/offers')
        ->and(Route::getRoutes()->getByName('app.gigs.offers.store')->methods())->toContain('POST')
        ->and(Route::getRoutes()->getByName('app.gig_offers.withdraw')->uri())->toBe('app/gig-offers/{gigOffer}/withdraw')
        ->and(Route::getRoutes()->getByName('app.gig_offers.withdraw')->methods())->toContain('PATCH')
        ->and(Route::getRoutes()->getByName('app.gig_offers.reject')->methods())->toContain('PATCH')
        ->and(Route::getRoutes()->getByName('app.gig_offers.accept')->methods())->toContain('PATCH')
        ->and(Route::getRoutes()->getByName('app.gigs.cancel')->uri())->toBe('app/gigs/{gig}/cancel')
        ->and(Route::getRoutes()->getByName('app.gigs.cancel')->methods())->toContain('PATCH');
});

test('guest and app middleware protect gig workflow routes', function () {
    $client = gigWorkflowUser(UserRole::Client);
    $gig = Gig::factory()->for($client, 'client')->create();
    $bannedFreelancer = gigWorkflowUser(UserRole::Freelancer);
    UserBan::query()->create([
        'user_id' => $bannedFreelancer->id,
        'banned_by' => $client->id,
        'reason' => 'Test ban',
        'banned_at' => now(),
    ]);
    $unverifiedFreelancer = User::factory()->freelancer()->unverified()->create(['onboarding_step' => null]);
    $onboardingFreelancer = User::factory()->freelancer()->create(['onboarding_step' => OnboardingStep::PickRole]);

    $this->post(route('app.gigs.offers.store', $gig))->assertRedirect(route('login'));
    $this->actingAs($bannedFreelancer->fresh())->post(route('app.gigs.offers.store', $gig))->assertForbidden();
    $this->actingAs($unverifiedFreelancer)->post(route('app.gigs.offers.store', $gig))->assertRedirectContains('/email/verify/notice/');
    $this->actingAs($onboardingFreelancer)->post(route('app.gigs.offers.store', $gig))->assertRedirect(route('onboarding'));
});

test('application validates input authorizes freelancer and creates offer with flash', function () {
    $client = gigWorkflowUser(UserRole::Client);
    $gig = Gig::factory()->for($client, 'client')->create(['posted_fee' => 125_000]);
    $freelancer = gigWorkflowUser(UserRole::Freelancer);

    $this->actingAs($client)
        ->post(route('app.gigs.offers.store', $gig))
        ->assertForbidden();
    $this->from('/app')->actingAs($freelancer)
        ->post(route('app.gigs.offers.store', $gig), ['offered_fee' => 999])
        ->assertRedirect('/app')
        ->assertSessionHasErrors('offered_fee');
    $this->from('/app')->actingAs($freelancer)
        ->post(route('app.gigs.offers.store', $gig), ['note' => str_repeat('a', 1001)])
        ->assertRedirect('/app')
        ->assertSessionHasErrors('note');

    $notifications = mock(NotificationService::class);
    $notifications->shouldReceive('send')->once();
    $notifications->shouldReceive('unreadCount')->andReturn(0);
    $this->from('/app')->actingAs($freelancer)
        ->post(route('app.gigs.offers.store', $gig), ['note' => 'Counter proposal'])
        ->assertRedirect('/app')
        ->assertSessionHas('success', 'Penawaran berhasil dikirim.');

    $offer = GigOffer::query()->where('gig_id', $gig->id)->where('freelancer_id', $freelancer->id)->firstOrFail();
    expect($offer->offered_fee)->toBe(125_000)
        ->and($offer->note)->toBe('Counter proposal')
        ->and($offer->status)->toBe(GigOfferStatus::PENDING);
});

test('only offer owner may withdraw and owner receives transition flash', function () {
    $client = gigWorkflowUser(UserRole::Client);
    $owner = gigWorkflowUser(UserRole::Freelancer);
    $offer = gigWorkflowOffer($client, $owner);

    $this->actingAs(gigWorkflowUser(UserRole::Freelancer))
        ->patch(route('app.gig_offers.withdraw', $offer))
        ->assertNotFound();
    expect($offer->refresh()->status)->toBe(GigOfferStatus::PENDING);
    $this->from('/app')->actingAs($owner)
        ->patch(route('app.gig_offers.withdraw', $offer))
        ->assertRedirect('/app')
        ->assertSessionHas('success', 'Penawaran berhasil ditarik.');

    expect($offer->refresh()->status)->toBe(GigOfferStatus::WITHDRAWN);
});

test('gig owner may reject and accept offers while other clients receive not found', function () {
    $owner = gigWorkflowUser(UserRole::Client);
    $otherClient = gigWorkflowUser(UserRole::Client);
    $rejectedOffer = gigWorkflowOffer($owner);
    $acceptedOffer = gigWorkflowOffer($owner);

    $this->actingAs($otherClient)
        ->patch(route('app.gig_offers.reject', $rejectedOffer))
        ->assertNotFound();
    expect($rejectedOffer->refresh()->status)->toBe(GigOfferStatus::PENDING);
    $notifications = mock(NotificationService::class);
    $notifications->shouldReceive('send')->twice();
    $notifications->shouldReceive('unreadCount')->andReturn(0);
    $this->from('/app')->actingAs($owner)
        ->patch(route('app.gig_offers.reject', $rejectedOffer))
        ->assertRedirect('/app')
        ->assertSessionHas('success', 'Penawaran berhasil ditolak.');
    $this->from('/app')->actingAs($owner)
        ->patch(route('app.gig_offers.accept', $acceptedOffer))
        ->assertRedirect(route('app.gigs.agreement.show', $acceptedOffer->gig_id))
        ->assertSessionHas('success', 'Penawaran berhasil diterima.');

    expect($rejectedOffer->refresh()->status)->toBe(GigOfferStatus::REJECTED)
        ->and($acceptedOffer->refresh()->status)->toBe(GigOfferStatus::ACCEPTED)
        ->and($acceptedOffer->gig->refresh()->status)->toBe(GigStatus::AgreementPreparation);
});

test('only gig owner may cancel and stale conflicts become flash errors', function () {
    $owner = gigWorkflowUser(UserRole::Client);
    $otherClient = gigWorkflowUser(UserRole::Client);
    $gig = Gig::factory()->for($owner, 'client')->create();

    $this->actingAs($otherClient)
        ->patch(route('app.gigs.cancel', $gig))
        ->assertNotFound();
    expect($gig->refresh()->status)->toBe(GigStatus::Open);
    $this->from('/app')->actingAs($owner)
        ->patch(route('app.gigs.cancel', $gig))
        ->assertRedirect('/app')
        ->assertSessionHas('success', 'Gig berhasil dibatalkan.');

    $staleOffer = gigWorkflowOffer($owner);
    $staleOffer->status = GigOfferStatus::REJECTED;
    $staleOffer->save();
    $notifications = mock(NotificationService::class);
    $notifications->shouldReceive('send')->never();
    $notifications->shouldReceive('unreadCount')->andReturn(0);
    $this->from('/app')->actingAs($owner)
        ->patch(route('app.gig_offers.reject', $staleOffer))
        ->assertRedirect('/app')
        ->assertSessionHas('error', 'Only pending offers may be rejected.');
});
