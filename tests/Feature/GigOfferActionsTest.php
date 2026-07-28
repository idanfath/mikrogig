<?php

use App\Actions\Gig\AcceptGigOffer;
use App\Actions\Gig\ApplyToGig;
use App\Actions\Gig\CancelGig;
use App\Actions\Gig\RejectGigOffer;
use App\Actions\Gig\WithdrawGigOffer;
use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

function gigOfferActionsUser(UserRole $role): User
{
    return match ($role) {
        UserRole::Freelancer => User::factory()->freelancer()->create(),
        UserRole::Client => User::factory()->client()->create(),
        default => User::factory()->create(['role' => $role]),
    };
}

function gigOfferActionsGig(User $client, GigStatus $status = GigStatus::Open, int $postedFee = 100_000): Gig
{
    return Gig::factory()
        ->for($client, 'client')
        ->create([
            'status' => $status,
            'posted_fee' => $postedFee,
        ]);
}

function gigOfferActionsOffer(Gig $gig, User $freelancer, GigOfferStatus $status = GigOfferStatus::PENDING): GigOffer
{
    return GigOffer::factory()
        ->for($gig)
        ->for($freelancer, 'freelancer')
        ->create([
            'status' => $status,
            'note' => 'Initial note',
        ]);
}

test('apply snapshots fee and reuses withdrawn offers with replacement values', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $gig = gigOfferActionsGig($client, postedFee: 150_000);

    $offer = app(ApplyToGig::class)->execute($freelancer, $gig, 120_000, 'Counter offer');

    expect($offer->offered_fee)->toBe(120_000)
        ->and($offer->note)->toBe('Counter offer')
        ->and($offer->status)->toBe(GigOfferStatus::PENDING);

    app(WithdrawGigOffer::class)->execute($freelancer, $offer);
    $reused = app(ApplyToGig::class)->execute($freelancer, $gig, null, null);

    expect($reused->id)->toBe($offer->id)
        ->and($reused->offered_fee)->toBe(150_000)
        ->and($reused->note)->toBeNull()
        ->and($reused->status)->toBe(GigOfferStatus::PENDING);
});

test('apply reuses auto-withdrawn offers with replacement values', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $gig = gigOfferActionsGig($client, postedFee: 150_000);
    $offer = gigOfferActionsOffer($gig, $freelancer, GigOfferStatus::AUTO_WITHDRAWN);

    $reused = app(ApplyToGig::class)->execute($freelancer, $gig, 120_000, 'Replacement note');

    expect($reused->id)->toBe($offer->id)
        ->and($reused->offered_fee)->toBe(120_000)
        ->and($reused->note)->toBe('Replacement note')
        ->and($reused->status)->toBe(GigOfferStatus::PENDING);
});

test('apply notifies client upon submission', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $gig = gigOfferActionsGig($client);

    $notifications = [];
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->once()
        ->andReturnUsing(function (...$arguments) use (&$notifications): void {
            $notifications[] = $arguments;
        });

    app(ApplyToGig::class)->execute($freelancer, $gig, null, null);

    expect($notifications[0][0])->toBe('Pelamar Baru')
        ->and($notifications[0][2])->toBe($freelancer->id)
        ->and($notifications[0][4])->toBe([$client->id]);
});

test('apply forbids reusing every non-withdrawn offer state', function (GigOfferStatus $status) {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $gig = gigOfferActionsGig($client);
    gigOfferActionsOffer($gig, $freelancer, $status);

    expect(fn () => app(ApplyToGig::class)->execute($freelancer, $gig, null, null))
        ->toThrow(DomainException::class);
})->with([
    GigOfferStatus::PENDING,
    GigOfferStatus::REJECTED,
    GigOfferStatus::ACCEPTED,
]);

test('auto-withdrawn offers cannot be reused while freelancer has active accepted work', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $acceptedGig = gigOfferActionsGig($client);
    $selectedOffer = gigOfferActionsOffer($acceptedGig, $freelancer);
    $otherGig = gigOfferActionsGig($client);
    $autoWithdrawnOffer = gigOfferActionsOffer($otherGig, $freelancer);

    app(AcceptGigOffer::class)->execute($client, $selectedOffer);

    expect($autoWithdrawnOffer->refresh()->status)->toBe(GigOfferStatus::AUTO_WITHDRAWN)
        ->and(fn () => app(ApplyToGig::class)->execute($freelancer, $otherGig, null, null))
        ->toThrow(DomainException::class);
});

test('apply enforces role ownership open status and pending offer limit', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);

    expect(fn () => app(ApplyToGig::class)->execute($client, gigOfferActionsGig($client), null, null))
        ->toThrow(AuthorizationException::class);
    expect(fn () => app(ApplyToGig::class)->execute($freelancer, gigOfferActionsGig($client, GigStatus::Cancelled), null, null))
        ->toThrow(DomainException::class);

    foreach (range(1, 3) as $index) {
        gigOfferActionsOffer(gigOfferActionsGig($client, postedFee: 100_000 + $index), $freelancer);
    }

    expect(fn () => app(ApplyToGig::class)->execute($freelancer, gigOfferActionsGig($client), null, null))
        ->toThrow(DomainException::class);
});

test('terminal accepted gigs no longer block applications', function (GigStatus $status) {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $acceptedGig = gigOfferActionsGig($client, $status);
    gigOfferActionsOffer($acceptedGig, $freelancer, GigOfferStatus::ACCEPTED);

    expect(app(ApplyToGig::class)->execute($freelancer, gigOfferActionsGig($client), null, null)->status)
        ->toBe(GigOfferStatus::PENDING);
})->with([GigStatus::Completed, GigStatus::Cancelled, GigStatus::DisputeResolved]);

test('disputed accepted gigs continue to block applications', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $acceptedGig = gigOfferActionsGig($client, GigStatus::Disputed);
    gigOfferActionsOffer($acceptedGig, $freelancer, GigOfferStatus::ACCEPTED);

    expect(fn () => app(ApplyToGig::class)->execute($freelancer, gigOfferActionsGig($client), null, null))
        ->toThrow(DomainException::class);
});

test('withdraw requires owner and pending status without deleting offer', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $otherFreelancer = gigOfferActionsUser(UserRole::Freelancer);
    $offer = gigOfferActionsOffer(gigOfferActionsGig($client), $freelancer);

    expect(fn () => app(WithdrawGigOffer::class)->execute($otherFreelancer, $offer))
        ->toThrow(AuthorizationException::class);

    $withdrawn = app(WithdrawGigOffer::class)->execute($freelancer, $offer);
    expect($withdrawn->status)->toBe(GigOfferStatus::WITHDRAWN);
    $this->assertModelExists($withdrawn);

    expect(fn () => app(WithdrawGigOffer::class)->execute($freelancer, $withdrawn))
        ->toThrow(DomainException::class);
});

test('reject enforces guards releases a slot and notifies freelancer', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $otherClient = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $gig = gigOfferActionsGig($client);
    $offer = gigOfferActionsOffer($gig, $freelancer);
    $notifications = [];
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->twice()
        ->andReturnUsing(function (...$arguments) use (&$notifications): void {
            $notifications[] = $arguments;
        });

    expect(fn () => app(RejectGigOffer::class)->execute($otherClient, $offer))
        ->toThrow(AuthorizationException::class);

    $rejected = app(RejectGigOffer::class)->execute($client, $offer);
    expect($rejected->status)->toBe(GigOfferStatus::REJECTED)
        ->and($notifications[0][0])->toBe('Penawaran ditolak')
        ->and($notifications[0][4])->toBe([$freelancer->id]);

    app(ApplyToGig::class)->execute($freelancer, gigOfferActionsGig($client), null, null);
});

test('reject keeps committed state when notification fails', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $offer = gigOfferActionsOffer(gigOfferActionsGig($client), gigOfferActionsUser(UserRole::Freelancer));
    mock(NotificationService::class)->shouldReceive('send')->once()->andThrow(new RuntimeException('Notification failed'));

    app(RejectGigOffer::class)->execute($client, $offer);

    expect($offer->refresh()->status)->toBe(GigOfferStatus::REJECTED);
});

test('accept fans out statuses and targeted notifications', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $winner = gigOfferActionsUser(UserRole::Freelancer);
    $competitor = gigOfferActionsUser(UserRole::Freelancer);
    $gig = gigOfferActionsGig($client);
    $selected = gigOfferActionsOffer($gig, $winner);
    $competitorOffer = gigOfferActionsOffer($gig, $competitor);
    $otherPendingOffer = gigOfferActionsOffer(gigOfferActionsGig($client), $winner);
    $notifications = [];
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->twice()
        ->andReturnUsing(function (...$arguments) use (&$notifications): void {
            $notifications[] = $arguments;
        });

    $accepted = app(AcceptGigOffer::class)->execute($client, $selected);

    expect($accepted->status)->toBe(GigOfferStatus::ACCEPTED)
        ->and($competitorOffer->refresh()->status)->toBe(GigOfferStatus::AUTO_WITHDRAWN)
        ->and($otherPendingOffer->refresh()->status)->toBe(GigOfferStatus::AUTO_WITHDRAWN)
        ->and($gig->refresh()->status)->toBe(GigStatus::AgreementPreparation)
        ->and(collect($notifications)->pluck(4)->all())->toContain([$winner->id], [$competitor->id])
        ->and($notifications[0][3])->toContain('Aplikasi tertunda lainnya ditarik otomatis')
        ->and($notifications[1][0])->toBe('Penawaran Ditarik Otomatis')
        ->and($notifications[1][3])->toContain('klien memilih freelancer lain')
        ->and($notifications[1][3])->toContain('melamar kembali');
});

test('accept cannot select freelancer already accepted on another active gig', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    $firstOffer = gigOfferActionsOffer(gigOfferActionsGig($client), $freelancer);

    mock(NotificationService::class)->shouldReceive('send')->once();
    app(AcceptGigOffer::class)->execute($client, $firstOffer);

    $secondGig = gigOfferActionsGig($client);
    $secondOffer = gigOfferActionsOffer($secondGig, $freelancer);

    expect(fn () => app(AcceptGigOffer::class)->execute($client, $secondOffer))
        ->toThrow(DomainException::class)
        ->and($secondOffer->refresh()->status)->toBe(GigOfferStatus::PENDING)
        ->and($secondGig->refresh()->status)->toBe(GigStatus::Open);
});

test('accept rejects active accepted work and keeps committed state when notification fails', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $freelancer = gigOfferActionsUser(UserRole::Freelancer);
    gigOfferActionsOffer(gigOfferActionsGig($client, GigStatus::AgreementPreparation), $freelancer, GigOfferStatus::ACCEPTED);
    $offer = gigOfferActionsOffer(gigOfferActionsGig($client), $freelancer);

    expect(fn () => app(AcceptGigOffer::class)->execute($client, $offer))->toThrow(DomainException::class);

    $availableFreelancer = gigOfferActionsUser(UserRole::Freelancer);
    $availableOffer = gigOfferActionsOffer(gigOfferActionsGig($client), $availableFreelancer);
    mock(NotificationService::class)->shouldReceive('send')->once()->andThrow(new RuntimeException('Notification failed'));
    app(AcceptGigOffer::class)->execute($client, $availableOffer);

    expect($availableOffer->refresh()->status)->toBe(GigOfferStatus::ACCEPTED);
});

test('cancel open and agreement preparation gigs preserves acceptance and releases active work', function (GigStatus $status) {
    $client = gigOfferActionsUser(UserRole::Client);
    $acceptedFreelancer = gigOfferActionsUser(UserRole::Freelancer);
    $pendingFreelancer = gigOfferActionsUser(UserRole::Freelancer);
    $gig = gigOfferActionsGig($client, $status);
    $acceptedOffer = gigOfferActionsOffer($gig, $acceptedFreelancer, GigOfferStatus::ACCEPTED);
    $pendingOffer = gigOfferActionsOffer($gig, $pendingFreelancer);
    $notifications = [];
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->times(3)
        ->andReturnUsing(function (...$arguments) use (&$notifications): void {
            $notifications[] = $arguments;
        });

    $cancelled = app(CancelGig::class)->execute($client, $gig);

    expect($cancelled->status)->toBe(GigStatus::Cancelled)
        ->and($cancelled->cancelled_at)->not->toBeNull()
        ->and($acceptedOffer->refresh()->status)->toBe(GigOfferStatus::ACCEPTED)
        ->and($pendingOffer->refresh()->status)->toBe(GigOfferStatus::REJECTED)
        ->and(collect($notifications)->pluck(4)->all())->toContain([$acceptedFreelancer->id], [$pendingFreelancer->id]);

    expect(app(ApplyToGig::class)->execute($acceptedFreelancer, gigOfferActionsGig($client), null, null)->status)
        ->toBe(GigOfferStatus::PENDING);
})->with([GigStatus::Open, GigStatus::AgreementPreparation]);

test('cancel rejects non-cancellable status and keeps committed state when notification fails', function () {
    $client = gigOfferActionsUser(UserRole::Client);
    $lockedGig = gigOfferActionsGig($client, GigStatus::Locked);
    expect(fn () => app(CancelGig::class)->execute($client, $lockedGig))->toThrow(DomainException::class);

    $openGig = gigOfferActionsGig($client);
    gigOfferActionsOffer($openGig, gigOfferActionsUser(UserRole::Freelancer));
    mock(NotificationService::class)->shouldReceive('send')->once()->andThrow(new RuntimeException('Notification failed'));
    app(CancelGig::class)->execute($client, $openGig);

    expect($openGig->refresh()->status)->toBe(GigStatus::Cancelled);
});
