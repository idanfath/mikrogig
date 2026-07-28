<?php

use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigMessage;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\GigConversationService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(LazilyRefreshDatabase::class);

test('client beranda uses real summaries and actions', function () {
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create(['status' => GigStatus::Open]);
    GigOffer::factory()
        ->for($gig)
        ->for($freelancer, 'freelancer')
        ->create(['status' => GigOfferStatus::PENDING]);

    $this->actingAs($client)
        ->get(route('app.home'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/home')
            ->where('home.role', 'client')
            ->where('home.account_state', 'active')
            ->where('home.summary.active_gigs', 1)
            ->where('home.summary.new_applicants', 1)
            ->where('home.actions.0.kind', 'applicants')
            ->where('home.actions.0.target.type', 'applicants')
            ->where('home.actions.0.target.id', $gig->id)
            ->where('chat_notices.data', []));
});

test('unread chat notices are grouped and exclude system messages', function () {
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create(['status' => GigStatus::AgreementPreparation]);
    $offer = GigOffer::factory()
        ->for($gig)
        ->for($freelancer, 'freelancer')
        ->create(['status' => GigOfferStatus::ACCEPTED]);
    $agreement = GigAgreement::factory()
        ->for($gig)
        ->for($offer, 'acceptedOffer')
        ->create();
    GigMessage::factory()
        ->count(2)
        ->for($agreement, 'agreement')
        ->for($freelancer, 'sender')
        ->for($client, 'recipient')
        ->create();
    GigMessage::factory()->system()->for($agreement, 'agreement')->create();

    $notices = app(GigConversationService::class)->unreadNotices($client);

    expect($notices['has_more'])->toBeFalse()
        ->and($notices['data'])->toHaveCount(1)
        ->and($notices['data'][0]['agreement_id'])->toBe($agreement->id)
        ->and($notices['data'][0]['unread_count'])->toBe(2)
        ->and($notices['data'][0]['sender']['id'])->toBe($freelancer->id)
        ->and($notices['data'][0]['gig_title'])->toBe($gig->title);
});
