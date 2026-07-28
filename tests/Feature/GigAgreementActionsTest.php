<?php

use App\Actions\Agreement\AcceptGigAgreement;
use App\Actions\Gig\AcceptGigOffer;
use App\Actions\Gig\ApplyToGig;
use App\Actions\Gig\CancelGig;
use App\Actions\Agreement\DeclineGigAgreement;
use App\Actions\Agreement\LeaveGigAgreementPreparation;
use App\Actions\Gig\RejectSelectedFreelancer;
use App\Actions\Agreement\RequestGigAgreementChanges;
use App\Actions\Agreement\SubmitGigAgreementTerms;
use App\Enums\GigAgreementClosureReason;
use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Http\Resources\GigAgreementResource;
use App\Http\Resources\GigResource;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

function agreementWorkflow(): array
{
    $client = User::factory()->client()->create();
    $freelancer = User::factory()->freelancer()->create();
    $gig = Gig::factory()->for($client, 'client')->create();
    $offer = GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->create(['offered_fee' => 150_000]);

    mock(NotificationService::class)->shouldReceive('send')->zeroOrMoreTimes();
    app(AcceptGigOffer::class)->execute($client, $offer);

    return [$client, $freelancer, $gig, $offer, GigAgreement::query()->firstOrFail()];
}

function agreementTerms(): array
{
    return [
        'final_scope' => 'Pasang instalasi lengkap.',
        'work_date' => now(config('app.timezone'))->addDay()->toDateString(),
        'start_time' => '10:00',
        'location_arrangement' => 'Temui klien di alamat gig.',
        'delivery_expectations' => 'Selesai dan diuji pada hari kerja.',
        'final_total_price' => 175_000,
    ];
}

test('winner selection creates one seeded agreement attempt', function () {
    [, , $gig, $offer, $agreement] = agreementWorkflow();

    expect($gig->refresh()->status)->toBe(GigStatus::AgreementPreparation)
        ->and($agreement->gig_id)->toBe($gig->id)
        ->and($agreement->gig_offer_id)->toBe($offer->id)
        ->and($agreement->accepted_fee)->toBe(150_000)
        ->and($agreement->final_scope)->toBe($gig->description)
        ->and($agreement->terms_version)->toBe(0)
        ->and($gig->currentAgreement->id)->toBe($agreement->id);
});

test('agreement factory creates linked accepted offer and cast values', function () {
    $agreement = GigAgreement::factory()->submitted()->create();

    expect($agreement->accepted_fee)->toBeInt()
        ->and($agreement->final_total_price)->toBeInt()
        ->and($agreement->acceptedOffer->status)->toBe(GigOfferStatus::ACCEPTED)
        ->and($agreement->gig->status)->toBe(GigStatus::AgreementPreparation)
        ->and($agreement->submitted_at)->not->toBeNull();
});

test('gig and agreement resources expose time inputs without seconds', function () {
    $agreement = GigAgreement::factory()->create(['start_time' => '10:15:00']);
    $agreement->gig->start_time = '09:30:00';

    expect(GigResource::make($agreement->gig)->resolve(request())['start_time'])->toBe('09:30')
        ->and(GigAgreementResource::make($agreement)->resolve(request())['start_time'])->toBe('10:15');
});

test('client submits terms and freelancer confirms them', function () {
    [$client, $freelancer, $gig, , $agreement] = agreementWorkflow();

    $submitted = app(SubmitGigAgreementTerms::class)->execute($client, $gig, agreementTerms());
    expect($submitted->terms_version)->toBe(1)
        ->and($submitted->submitted_at)->not->toBeNull()
        ->and($gig->refresh()->status)->toBe(GigStatus::LockPending);

    app(AcceptGigAgreement::class)->execute($freelancer, $gig);
    expect($gig->refresh()->status)->toBe(GigStatus::PaymentPending)
        ->and($agreement->refresh()->freelancer_confirmed_at)->not->toBeNull();

    expect(fn () => app(SubmitGigAgreementTerms::class)->execute($client, $gig, agreementTerms()))->toThrow(DomainException::class);
});

test('freelancer change request returns gig to preparation and client resubmission increments version', function () {
    [$client, $freelancer, $gig, , $agreement] = agreementWorkflow();
    app(SubmitGigAgreementTerms::class)->execute($client, $gig, agreementTerms());

    app(RequestGigAgreementChanges::class)->execute($freelancer, $gig, 'Mohon mulai lebih siang.');
    expect($gig->refresh()->status)->toBe(GigStatus::AgreementPreparation)
        ->and($agreement->refresh()->latest_change_request_note)->toBe('Mohon mulai lebih siang.');

    app(SubmitGigAgreementTerms::class)->execute($client, $gig, agreementTerms());
    expect($agreement->refresh()->terms_version)->toBe(2)
        ->and($gig->refresh()->status)->toBe(GigStatus::LockPending);
});

test('freelancer may leave before terms then reuse withdrawn offer', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = agreementWorkflow();

    app(LeaveGigAgreementPreparation::class)->execute($freelancer, $gig);
    expect($gig->refresh()->status)->toBe(GigStatus::Open)
        ->and($offer->refresh()->status)->toBe(GigOfferStatus::WITHDRAWN)
        ->and($agreement->refresh()->closure_reason)->toBe(GigAgreementClosureReason::FreelancerLeft);

    $reused = app(ApplyToGig::class)->execute($freelancer, $gig, 160_000, 'Melamar lagi');
    expect($reused->id)->toBe($offer->id)
        ->and($reused->status)->toBe(GigOfferStatus::PENDING);
});

test('decline and client rejection close agreement and reopen gig', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = agreementWorkflow();
    app(SubmitGigAgreementTerms::class)->execute($client, $gig, agreementTerms());
    app(DeclineGigAgreement::class)->execute($freelancer, $gig);

    expect($gig->refresh()->status)->toBe(GigStatus::Open)
        ->and($offer->refresh()->status)->toBe(GigOfferStatus::WITHDRAWN)
        ->and($agreement->refresh()->closure_reason)->toBe(GigAgreementClosureReason::FreelancerDeclined);

    $offer->status = GigOfferStatus::PENDING;
    $offer->save();
    app(AcceptGigOffer::class)->execute($client, $offer);
    app(RejectSelectedFreelancer::class)->execute($client, $gig);

    expect($gig->refresh()->status)->toBe(GigStatus::Open)
        ->and($offer->refresh()->status)->toBe(GigOfferStatus::REJECTED)
        ->and(GigAgreement::query()->count())->toBe(2);
});

test('cancellation closes active agreement and keeps accepted offer history', function () {
    [$client, , $gig, $offer, $agreement] = agreementWorkflow();

    app(CancelGig::class)->execute($client, $gig);

    expect($gig->refresh()->status)->toBe(GigStatus::Cancelled)
        ->and($offer->refresh()->status)->toBe(GigOfferStatus::ACCEPTED)
        ->and($agreement->refresh()->closure_reason)->toBe(GigAgreementClosureReason::GigCancelled)
        ->and($agreement->closed_at)->not->toBeNull();
});

test('agreement notifications include agreement destination and label', function () {
    [$client, $freelancer, $gig] = agreementWorkflow();
    $notifications = [];
    mock(NotificationService::class)->shouldReceive('send')->once()->andReturnUsing(function (...$arguments) use (&$notifications): void {
        $notifications[] = $arguments;
    });

    app(SubmitGigAgreementTerms::class)->execute($client, $gig, agreementTerms());

    expect($notifications[0][4])->toBe([$freelancer->id])
        ->and($notifications[0][6])->toBe(route('app.gigs.agreement.show', $gig))
        ->and($notifications[0][7])->toBe('Lihat Persetujuan');
});
