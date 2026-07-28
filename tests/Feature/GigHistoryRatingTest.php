<?php

use App\Actions\Workflow\SubmitGigRating;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigDispute;
use App\Models\GigDisputeMedia;
use App\Models\GigDisputeSubmission;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\GigRating;
use App\Models\User;
use App\Models\UserBan;
use App\Services\NotificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

beforeEach(function () {
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->zeroOrMoreTimes()
        ->shouldReceive('unreadCount')
        ->zeroOrMoreTimes()
        ->andReturn(0);
});

function terminalHistoryGig(GigStatus $status = GigStatus::Completed): array
{
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create([
        'status' => $status,
        'completed_at' => $status === GigStatus::Completed ? now() : null,
        'cancelled_at' => $status === GigStatus::Cancelled ? now() : null,
    ]);
    $offer = GigOffer::factory()
        ->for($gig)
        ->for($freelancer, 'freelancer')
        ->accepted()
        ->create();

    return [$client, $freelancer, $gig, $offer];
}

test('rating model factory relationships casts and database constraints are valid', function () {
    [$client, $freelancer, $gig] = terminalHistoryGig();
    $rating = GigRating::factory()
        ->for($gig)
        ->for($client, 'rater')
        ->for($freelancer, 'recipient')
        ->score(4)
        ->withoutComment()
        ->create();

    expect($rating->score)->toBe(4)
        ->and($rating->comment)->toBeNull()
        ->and($rating->gig->is($gig))->toBeTrue()
        ->and($rating->rater->is($client))->toBeTrue()
        ->and($rating->recipient->is($freelancer))->toBeTrue()
        ->and($gig->ratings()->sole()->is($rating))->toBeTrue()
        ->and($client->ratingsGiven()->sole()->is($rating))->toBeTrue()
        ->and($freelancer->ratingsReceived()->sole()->is($rating))->toBeTrue()
        ->and(fn () => $rating->update(['score' => 1]))->toThrow(LogicException::class)
        ->and(fn () => $rating->delete())->toThrow(LogicException::class);

    expect(fn () => GigRating::factory()
        ->for($gig)
        ->for($client, 'rater')
        ->for($freelancer, 'recipient')
        ->create())->toThrow(QueryException::class);
});

test('client and selected freelancer can browse terminal history while others cannot', function () {
    [$client, $freelancer, $gig] = terminalHistoryGig();
    $applicant = User::factory()->freelancer()->create(['onboarding_step' => null]);
    GigOffer::factory()->for($gig)->for($applicant, 'freelancer')->rejected()->create();

    foreach ([$client, $freelancer] as $participant) {
        $this->actingAs($participant)
            ->get(route('app.history.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('app/history/index')
                ->where('gigs.data.0.id', $gig->id));

        $this->actingAs($participant)
            ->get(route('app.history.show', $gig))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('app/history/show')
                ->where('gig.id', $gig->id)
                ->where('capabilities.canRate', true));
    }

    $this->actingAs($applicant)->get(route('app.history.show', $gig))->assertForbidden();

    $gig->forceFill(['status' => GigStatus::InProgress])->save();
    $this->actingAs($client)->get(route('app.history.show', $gig))->assertForbidden();
});

test('history filters paginate terminal gigs and supports cancellation without selection', function () {
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    Gig::factory()->count(16)->for($client, 'client')->create([
        'status' => GigStatus::Cancelled,
        'cancelled_at' => now(),
    ]);
    Gig::factory()->for($client, 'client')->create([
        'status' => GigStatus::Completed,
        'completed_at' => now(),
    ]);

    $this->actingAs($client)
        ->get(route('app.history.index', ['status' => GigStatus::Cancelled->value]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.status', GigStatus::Cancelled->value)
            ->has('gigs.data', 15)
            ->where('gigs.last_page', 2));

    $this->actingAs($client)
        ->get(route('app.history.index', ['search' => 'nonexistent_keyword']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.search', 'nonexistent_keyword')
            ->has('gigs.data', 0));

    $cancelled = Gig::query()->where('client_id', $client->id)->where('status', GigStatus::Cancelled)->firstOrFail();
    $this->actingAs($client)
        ->get(route('app.history.show', $cancelled))
        ->assertInertia(fn (Assert $page) => $page
            ->where('counterpart', null)
            ->where('capabilities.canRate', false)
            ->has('agreements', 0)
            ->has('payments', 0));
});

test('both participants may rate every terminal status once', function () {
    foreach ([GigStatus::Completed, GigStatus::Cancelled, GigStatus::DisputeResolved] as $status) {
        [$client, $freelancer, $gig] = terminalHistoryGig($status);

        $clientRating = app(SubmitGigRating::class)->execute($client, $gig, 5, 'Kerja bagus.');
        $freelancerRating = app(SubmitGigRating::class)->execute($freelancer, $gig, 4, null);

        expect($clientRating->recipient_id)->toBe($freelancer->id)
            ->and($freelancerRating->recipient_id)->toBe($client->id)
            ->and($gig->ratings()->count())->toBe(2);
    }
});

test('rating action rejects invalid duplicate unrelated and banned submissions', function () {
    [$client, $freelancer, $gig] = terminalHistoryGig();
    $other = User::factory()->freelancer()->create();
    $admin = User::factory()->create(['role' => UserRole::Admin, 'onboarding_step' => null]);

    expect(fn () => app(SubmitGigRating::class)->execute($client, $gig, 0, null))
        ->toThrow(DomainException::class)
        ->and(fn () => app(SubmitGigRating::class)->execute($client, $gig, 5, str_repeat('a', 1001)))
        ->toThrow(DomainException::class)
        ->and(fn () => app(SubmitGigRating::class)->execute($other, $gig, 5, null))
        ->toThrow(AuthorizationException::class);
    $this->actingAs($admin)->get(route('app.history.index'))->assertForbidden();
    $this->actingAs($admin)->get(route('app.history.show', $gig))->assertForbidden();

    app(SubmitGigRating::class)->execute($client, $gig, 5, null);
    expect(fn () => app(SubmitGigRating::class)->execute($client, $gig, 4, null))
        ->toThrow(DomainException::class);

    UserBan::query()->create([
        'user_id' => $freelancer->id,
        'reason' => 'Ban aktif',
        'banned_at' => now(),
        'banned_until' => now()->addDay(),
    ]);

    expect(fn () => app(SubmitGigRating::class)->execute($freelancer, $gig, 4, null))
        ->toThrow(AuthorizationException::class);

    $unselectedGig = Gig::factory()->for($client, 'client')->create([
        'status' => GigStatus::Cancelled,
        'cancelled_at' => now(),
    ]);
    expect(fn () => app(SubmitGigRating::class)->execute($client, $unselectedGig, 5, null))
        ->toThrow(DomainException::class);

    $selfGig = Gig::factory()->for($client, 'client')->create([
        'status' => GigStatus::Completed,
        'completed_at' => now(),
    ]);
    GigOffer::factory()->for($selfGig)->for($client, 'freelancer')->accepted()->create();
    expect(fn () => app(SubmitGigRating::class)->execute($client, $selfGig, 5, null))
        ->toThrow(DomainException::class);
});

test('HTTP validation conflicts immutable ratings and notification metadata work', function () {
    [$client, $freelancer, $gig] = terminalHistoryGig();
    $notifications = mock(NotificationService::class);
    $notifications->shouldReceive('unreadCount')->zeroOrMoreTimes()->andReturn(0);
    $notifications->shouldReceive('send')->never();

    $this->actingAs($client)
        ->post(route('app.history.ratings.store', $gig), [
            'score' => 6,
            'comment' => str_repeat('a', 1001),
        ])
        ->assertSessionHasErrors('score');

    expect(route('app.history.ratings.store', $gig))->not->toContain('edit')
        ->and(collect(app('router')->getRoutes())->contains(fn ($route) => str_contains($route->uri(), 'ratings') && in_array('DELETE', $route->methods(), true)))->toBeFalse();
});

test('ratings appear immediately on public profile without private history links', function () {
    [$client, $freelancer, $gig] = terminalHistoryGig();
    app(SubmitGigRating::class)->execute($client, $gig, 5, 'Profesional.');
    $viewer = User::factory()->client()->create(['onboarding_step' => null]);

    $this->actingAs($viewer)
        ->get(route('app.profile.show', $freelancer))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('profile.rating_summary.average', 5)
            ->where('profile.rating_summary.count', 1)
            ->where('profile.rating_summary.latest.0.author.name', $client->name)
            ->where('profile.rating_summary.latest.0.gig.title', $gig->title)
            ->missing('profile.rating_summary.latest.0.history_url'));
});

test('banned participants retain terminal history and evidence but not active evidence or rating mutation', function () {
    Storage::fake('cos-private');
    $payment = GigPayment::factory()->paid()->create();
    $gig = $payment->gig;
    $client = $gig->client;
    $freelancer = $payment->agreement->acceptedOffer->freelancer;
    $client->forceFill(['onboarding_step' => null])->save();
    $freelancer->forceFill(['onboarding_step' => null])->save();
    $dispute = GigDispute::factory()->create([
        'gig_id' => $gig->id,
        'gig_agreement_id' => $payment->gig_agreement_id,
        'gig_payment_id' => $payment->id,
        'reporter_id' => $client->id,
        'respondent_id' => $freelancer->id,
    ]);
    $submission = GigDisputeSubmission::factory()->for($dispute, 'dispute')->create([
        'submitted_by' => $client->id,
    ]);
    $media = GigDisputeMedia::factory()->for($submission, 'submission')->create([
        'path' => 'gig-workflow/test-evidence.jpg',
    ]);
    Storage::disk('cos-private')->put($media->path, 'private');
    UserBan::query()->create([
        'user_id' => $client->id,
        'reason' => 'Ban aktif',
        'banned_at' => now(),
        'banned_until' => now()->addDay(),
    ]);

    $gig->forceFill(['status' => GigStatus::DisputeResolved])->save();
    $this->actingAs($client)->get(route('app.history.show', $gig))->assertOk();
    $this->actingAs($client)->get(route('app.gig_dispute_media.show', $media))->assertOk();
    $this->actingAs($client)
        ->post(route('app.history.ratings.store', $gig), ['score' => 5])
        ->assertForbidden();

    $gig->forceFill(['status' => GigStatus::Disputed])->save();
    $this->actingAs($client)
        ->get(route('app.gig_dispute_media.show', $media))
        ->assertNotFound();
});
