<?php

use App\Actions\Gig\AcceptGigOffer;
use App\Enums\GigEstimatedDuration;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

function agreementHttpState(): array
{
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create();
    $offer = GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->create();

    mock(NotificationService::class)
        ->shouldReceive('send')
        ->zeroOrMoreTimes()
        ->shouldReceive('unreadCount')
        ->zeroOrMoreTimes()
        ->andReturn(0);
    app(AcceptGigOffer::class)->execute($client, $offer);

    return [$client, $freelancer, $gig];
}

function agreementHttpTerms(): array
{
    return [
        'final_scope' => 'Lingkup final.',
        'work_date' => now(config('app.timezone'))->addDay()->toDateString(),
        'start_time' => '10:00',
        'location_arrangement' => 'Alamat gig.',
        'delivery_expectations' => 'Selesai dan diuji.',
        'estimated_duration' => GigEstimatedDuration::TwoToFourHours->value,
        'final_total_price' => 150_000,
    ];
}

test('agreement page is private to client and selected freelancer', function () {
    [$client, $freelancer, $gig] = agreementHttpState();

    $this->actingAs($client)->get(route('app.gigs.agreement.show', $gig))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('app/gigs/agreement')->has('gig')->has('agreement'));
    $this->actingAs($freelancer)->get(route('app.gigs.agreement.show', $gig))->assertOk();
    $this->actingAs(User::factory()->freelancer()->create(['onboarding_step' => null]))
        ->get(route('app.gigs.agreement.show', $gig))
        ->assertNotFound();
});

test('client submits terms and freelancer accepts through HTTP routes', function () {
    [$client, $freelancer, $gig] = agreementHttpState();

    $this->from('/app')
        ->actingAs($client)
        ->patch(route('app.gigs.agreement.terms.update', $gig), agreementHttpTerms())
        ->assertRedirect('/app')
        ->assertSessionHas('success', 'Syarat gig berhasil dikirim.');
    expect($gig->refresh()->status)->toBe(GigStatus::LockPending);

    $this->from('/app')
        ->actingAs($freelancer)
        ->patch(route('app.gigs.agreement.accept', $gig))
        ->assertRedirect(route('app.gigs.payment.show', $gig))
        ->assertSessionHas('success', 'Syarat gig berhasil disetujui.');
    expect($gig->refresh()->status)->toBe(GigStatus::PaymentPending);
});

test('client form validation and freelancer ownership run before workflow action', function () {
    [$client, , $gig] = agreementHttpState();

    $this->from('/app')->actingAs($client)
        ->patch(route('app.gigs.agreement.terms.update', $gig), [])
        ->assertRedirect('/app')
        ->assertSessionHasErrors(['final_scope', 'work_date', 'start_time', 'estimated_duration', 'final_total_price']);
    $this->actingAs(User::factory()->freelancer()->create(['onboarding_step' => null]))
        ->patch(route('app.gigs.agreement.leave', $gig))
        ->assertNotFound();
});
