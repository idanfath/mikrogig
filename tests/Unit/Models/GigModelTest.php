<?php

use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('gig factory creates open gig for client', function () {
    $gig = Gig::factory()->create();

    expect($gig->status)
        ->toBe(GigStatus::Open)
        ->and($gig->client)
        ->toBeInstanceOf(User::class)
        ->and($gig->client->role)
        ->toBe(UserRole::Client)
        ->and($gig->posted_fee)
        ->toBeInt();
});

test('gig offer factory links freelancer to gig', function () {
    $offer = GigOffer::factory()->create();

    expect($offer->status)
        ->toBe(GigOfferStatus::PENDING)
        ->and($offer->gig)
        ->toBeInstanceOf(Gig::class)
        ->and($offer->freelancer)
        ->toBeInstanceOf(User::class)
        ->and($offer->freelancer->role)
        ->toBe(UserRole::Freelancer)
        ->and($offer->offered_fee)
        ->toBeInt();
});

test('accepted offer relation resolves from gig', function () {
    $gig = Gig::factory()->create();
    $accepted = GigOffer::factory()->for($gig)->accepted()->create();
    GigOffer::factory()->for($gig)->create();

    expect($gig->fresh()->acceptedOffer?->is($accepted))
        ->toBeTrue()
        ->and($gig->fresh()->offers)
        ->toHaveCount(2);
});

test('user role factory states and direct relationships work', function () {
    $client = User::factory()->client()->create();
    $freelancer = User::factory()->freelancer()->create();
    $gig = Gig::factory()->for($client, 'client')->create();
    $offer = GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->create();

    expect($client->role)
        ->toBe(UserRole::Client)
        ->and($freelancer->role)
        ->toBe(UserRole::Freelancer)
        ->and($gig->client->is($client))
        ->toBeTrue()
        ->and($offer->freelancer->is($freelancer))
        ->toBeTrue()
        ->and($offer->gig->is($gig))
        ->toBeTrue()
        ->and($gig->offers->first()?->is($offer))
        ->toBeTrue();
});

test('gig offer lifecycle states are cast correctly', function () {
    expect(GigOffer::factory()->withdrawn()->create()->status)
        ->toBe(GigOfferStatus::WITHDRAWN)
        ->and(GigOffer::factory()->rejected()->create()->status)
        ->toBe(GigOfferStatus::REJECTED)
        ->and(GigOffer::factory()->accepted()->create()->status)
        ->toBe(GigOfferStatus::ACCEPTED)
        ->and(GigOffer::factory()->autoWithdrawn()->create()->status)
        ->toBe(GigOfferStatus::AUTO_WITHDRAWN);
});
