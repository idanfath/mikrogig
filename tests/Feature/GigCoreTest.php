<?php

use App\Actions\Gig\CreateGig;
use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\User;
use App\RegionCatalog;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(LazilyRefreshDatabase::class);

function gigCoreClient(): User
{
    return User::factory()->client()->create(['onboarding_step' => null]);
}

function gigCoreFreelancer(): User
{
    return User::factory()->freelancer()->create(['onboarding_step' => null]);
}

function gigCoreAttributes(array $overrides = []): array
{
    return [
        'title' => 'Perbaikan rumah',
        'description' => 'Perbaikan atap rumah.',
        'category' => 'construction',
        'province_id' => '11',
        'regency_id' => '1101',
        'location_address' => 'Jalan Utama 1',
        'location_latitude' => null,
        'location_longitude' => null,
        'location_accuracy_meters' => null,
        'work_date' => now(config('app.timezone'))->addDay()->toDateString(),
        'start_time' => '10:00',
        'posted_fee' => 200_000,
        ...$overrides,
    ];
}

test('client creates open gig with ordered photos and catalog names', function () {
    Storage::fake('cos');
    $client = gigCoreClient();
    $photos = [UploadedFile::fake()->image('first.jpg'), UploadedFile::fake()->image('second.png')];

    $gig = app(CreateGig::class)->execute($client, gigCoreAttributes(), $photos);

    expect($gig->status)->toBe(GigStatus::Open)
        ->and($gig->start_time)->toBe('10:00')
        ->and($gig->province_name)->toBe(app(RegionCatalog::class)->province('11')['name'])
        ->and($gig->regency_name)->toBe(app(RegionCatalog::class)->regency('11', '1101')['name'])
        ->and($gig->media)->toHaveCount(2)
        ->and($gig->media->pluck('id')->all())->toBe($gig->media->pluck('id')->sort()->values()->all());
    $this->assertModelExists($gig);
    foreach ($gig->media as $media) {
        Storage::disk('cos')->assertExists($media->path);
    }
});

test('gig submission validates client role and upload contract', function () {
    Storage::fake('cos');
    $freelancer = gigCoreFreelancer();
    $response = $this->actingAs($freelancer)->post(route('app.gigs.store'), [
        ...gigCoreAttributes(['posted_fee' => 999]),
        'photos' => [UploadedFile::fake()->create('wrong.gif', 100, 'image/gif')],
    ]);

    $response->assertForbidden();

    $client = gigCoreClient();
    $this->actingAs($client)->post(route('app.gigs.store'), [
        ...gigCoreAttributes(['posted_fee' => 999]),
        'photos' => [UploadedFile::fake()->create('wrong.gif', 100, 'image/gif')],
    ])->assertSessionHasErrors(['posted_fee', 'photos.0']);
});

test('gig submission redirects to contextual detail', function () {
    Storage::fake('cos');
    $client = gigCoreClient();

    $this->actingAs($client)->post(route('app.gigs.store'), [
        ...gigCoreAttributes(),
        'photos' => [UploadedFile::fake()->image('gig.webp')],
    ])->assertRedirect(route('app.gigs.show', Gig::first()))
        ->assertSessionHas('success', 'Gig berhasil dibuat.');
});

test('discovery hides past open gigs and counts pending applicants only', function () {
    Carbon::setTestNow('2026-08-01 10:00:00');
    $client = gigCoreClient();
    $freelancer = gigCoreFreelancer();
    $visible = Gig::factory()->for($client, 'client')->create(['work_date' => '2026-08-01', 'start_time' => '11:00:00']);
    $past = Gig::factory()->for($client, 'client')->create(['work_date' => '2026-08-01', 'start_time' => '09:00:00']);
    GigOffer::factory()->for($visible)->for($freelancer, 'freelancer')->create();
    GigOffer::factory()->for($visible)->rejected()->create();

    $this->actingAs($freelancer)->get(route('app.gigs.index'))
        ->assertInertia(fn ($page) => $page->component('app/gigs/index')
            ->has('gigs.data', 1)
            ->where('gigs.data.0.id', $visible->id)
            ->where('gigs.data.0.pending_applicants_count', 1));

    expect($past->exists)->toBeTrue();
    Carbon::setTestNow();
});

test('gig detail and applicant profiles follow visibility rules', function () {
    $client = gigCoreClient();
    $freelancer = gigCoreFreelancer();
    $gig = Gig::factory()->for($client, 'client')->create(['status' => GigStatus::AgreementPreparation]);
    $offer = GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->create(['status' => GigOfferStatus::ACCEPTED]);

    $this->actingAs($freelancer)->get(route('app.gigs.show', $gig))->assertInertia(fn ($page) => $page->component('app/gigs/show')->where('my_offer.id', $offer->id));
    $this->actingAs($freelancer)->get(route('app.client.gigs.applicants.index', $gig))->assertNotFound();
    $this->actingAs($client)->get(route('app.client.gigs.applicants.index', $gig))->assertInertia(fn ($page) => $page->component('app/client/gigs/applicants')->has('offers.data.0.freelancer.freelancer_profile'));
});
