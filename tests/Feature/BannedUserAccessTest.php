<?php

use App\Enums\GigExitExecutionMode;
use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Enums\GigSettlementOutcome;
use App\Enums\NotificationTargetType;
use App\Enums\OnboardingStep;
use App\Jobs\SendMailJob;
use App\Models\Gig;
use App\Models\GigDispute;
use App\Models\GigDisputeMedia;
use App\Models\GigDisputeSubmission;
use App\Models\GigExitRequest;
use App\Models\GigOffense;
use App\Models\GigPayment;
use App\Models\GigSettlement;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use App\Models\UserBan;
use App\Services\BanService;
use App\Services\GigOffenseService;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

function suspendedAccessUser(?string $until = '+3 days'): array
{
    $user = User::factory()->client()->create(['onboarding_step' => null]);
    $ban = UserBan::query()->create([
        'user_id' => $user->id,
        'reason' => 'Pelanggaran ketentuan gig',
        'banned_at' => now(),
        'banned_until' => $until === null ? null : now()->modify($until),
    ]);

    return [$user, $ban];
}

test('temporary suspension page exposes safe offense and resolution context', function () {
    [$user, $ban] = suspendedAccessUser();
    $payment = GigPayment::factory()->paid()->create();
    $settlement = GigSettlement::factory()
        ->for($payment, 'payment')
        ->create([
            'gig_id' => $payment->gig_id,
        'outcome' => GigSettlementOutcome::FullClientRefund,
        'freelancer_payout' => 0,
        'client_refund' => 100_000,
        'total_amount' => 100_000,
        ]);
    $gig = $settlement->gig;
    $exitRequest = GigExitRequest::factory()->for($gig)->create([
        'type' => GigExitType::FreelancerAbandonment,
        'status' => GigExitStatus::Executed,
        'execution_mode' => GigExitExecutionMode::Unilateral,
        'executed_at' => now(),
    ]);
    GigOffense::factory()->for($user)->for($gig)->create([
        'gig_exit_request_id' => $exitRequest->id,
        'user_ban_id' => $ban->id,
        'sequence' => 2,
        'duration_days' => 7,
    ]);

    $this->actingAs($user)
        ->get(route('app.suspension'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/suspension')
            ->where('ban.reason', 'Pelanggaran ketentuan gig')
            ->where('ban.is_permanent', false)
            ->where('ban.offense.sequence', 2)
            ->where('ban.offense.duration_days', 7)
            ->where('ban.offense.gig.title', $gig->title)
            ->where('ban.offense.source.kind', 'exit_request')
            ->where('ban.offense.source.type', GigExitType::FreelancerAbandonment->value)
            ->where('ban.offense.resolution.outcome', GigSettlementOutcome::FullClientRefund->value)
            ->has('server_now')
            ->missing('ban.offense.dispute_evidence'));
});

test('permanent suspension page has no expiry and non banned users return home', function () {
    [$user] = suspendedAccessUser(null);

    $this->actingAs($user)
        ->get(route('app.suspension'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/suspension')
            ->where('ban.is_permanent', true)
            ->where('ban.banned_until', null)
            ->where('ban.offense', null));

    $activeUser = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $this->actingAs($activeUser)
        ->get(route('app.suspension'))
        ->assertRedirect(route('app.home'));
});

test('suspension route cannot loop for a banned user with unfinished onboarding', function () {
    [$user] = suspendedAccessUser();
    $user->update(['onboarding_step' => OnboardingStep::PickRole]);

    $this->actingAs($user)
        ->get(route('onboarding'))
        ->assertRedirect(route('app.suspension'));
    $this->actingAs($user)
        ->get(route('app.suspension'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('app/suspension'));
});

test('banned users retain personal profile account region and notification access', function () {
    [$user] = suspendedAccessUser();
    $notification = Notification::query()->create([
        'title' => 'Pesan akun',
        'body' => 'Periksa akun Anda.',
        'target_type' => NotificationTargetType::User,
    ]);
    $recipient = NotificationRecipient::query()->create([
        'notification_id' => $notification->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)->get(route('app.home'))->assertOk();
    $this->actingAs($user)->get(route('app.user'))->assertOk();
    $this->actingAs($user)->get(route('app.profile'))->assertOk();
    $this->actingAs($user)->get(route('app.account'))->assertOk();
    $this->actingAs($user)->get(route('app.notifications'))->assertOk();
    $this->actingAs($user)->get(route('regions.provinces'))->assertOk();
    $this->actingAs($user)->get(route('regions.regencies', '11'))->assertOk();
    $this->actingAs($user)
        ->post(route('locations.resolve'))
        ->assertSessionHasErrors();

    $this->actingAs($user)
        ->put(route('app.profile.update'), [
            'name' => 'Nama Baru',
            'date_of_birth' => '1990-01-01',
            'province_id' => '11',
            'regency_id' => '1101',
        ])
        ->assertRedirect(route('app.profile'));

    $this->actingAs($user)
        ->put(route('app.account.password'), [
            'current_password' => 'password',
            'password' => 'password-baru',
            'password_confirmation' => 'password-baru',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('app.notifications.read', $notification))
        ->assertRedirect();
    expect($recipient->refresh()->read_at)->not->toBeNull();

    $this->actingAs($user)
        ->delete(route('app.notifications.destroy', $notification))
        ->assertRedirect();

    expect($user->refresh()->name)->toBe('Nama Baru')
        ->and(Hash::check('password-baru', $user->password))->toBeTrue()
        ->and(NotificationRecipient::query()->whereKey($recipient->id)->exists())->toBeFalse();

    $this->actingAs($user)->post(route('logout'))->assertRedirect(route('home'));
    $this->assertGuest();
});

test('business reads redirect while mutations remain forbidden for banned users', function () {
    [$user] = suspendedAccessUser();
    $other = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->create();
    $payment = GigPayment::factory()->paid()->create();
    $dispute = GigDispute::factory()
        ->for($payment, 'payment')
        ->create([
            'gig_id' => $payment->gig_id,
            'gig_agreement_id' => $payment->gig_agreement_id,
        ]);
    $submission = GigDisputeSubmission::factory()->for($dispute, 'dispute')->create();
    $media = GigDisputeMedia::factory()->for($submission, 'submission')->create();

    foreach ([
        route('app.profile.show', $other),
        route('app.gigs.index'),
        route('app.gigs.show', $gig),
        route('app.gigs.workflow.show', $gig),
        route('app.gig_disputes.show', $dispute),
        route('app.admin.gig_disputes.index'),
    ] as $url) {
        $this->actingAs($user)
            ->get($url)
            ->assertRedirect(route('app.suspension'));
    }

    $this->actingAs($user)
        ->get(route('app.gig_dispute_media.show', $media))
        ->assertNotFound();

    $this->actingAs($user)->post(route('app.gigs.store'))->assertForbidden();
    $this->actingAs($user)->patch(route('app.gigs.cancel', $gig))->assertForbidden();
    $this->actingAs($user)->post(route('app.gigs.disputes.store', $gig))->assertForbidden();
});

test('expired and manually released users regain business access', function () {
    [$expiredUser, $expiredBan] = suspendedAccessUser('-1 minute');
    [$releasedUser, $releasedBan] = suspendedAccessUser();
    $releasedBan->update(['unbanned_at' => now()]);

    expect($expiredBan->isActive())->toBeFalse()
        ->and($releasedBan->isActive())->toBeFalse();

    $this->actingAs($expiredUser)->get(route('app.client.gigs.index'))->assertOk();
    $this->actingAs($releasedUser)->get(route('app.client.gigs.index'))->assertOk();
});

test('route audit keeps every business endpoint behind banned user middleware', function () {
    $allowedWhileBanned = [
        'app.home',
        'app.user',
        'app.suspension',
        'app.profile',
        'app.profile.update',
        'app.account',
        'app.account.password',
        'app.notifications',
        'app.notifications.read-all',
        'app.notifications.read',
        'app.notifications.destroy',
        'app.history.index',
        'app.history.show',
        'app.gig_finish_request_media.show',
        'app.gig_dispute_media.show',
        'app.gig_conversations.show',
        'app.gig_conversations.destination',
        'app.gig_message_media.show',
    ];

    foreach (Route::getRoutes() as $route) {
        if (! str_starts_with((string) $route->getName(), 'app.')) {
            continue;
        }

        expect($route->gatherMiddleware())
            ->toContain('auth', 'verified', 'must_onboard');

        if (in_array($route->getName(), $allowedWhileBanned, true)) {
            expect($route->gatherMiddleware())->not->toContain('no_banned_user');
        } else {
            expect($route->gatherMiddleware())->toContain('no_banned_user');
        }
    }

    foreach (['regions.provinces', 'regions.regencies', 'locations.resolve', 'freelancer.enhance'] as $name) {
        expect(Route::getRoutes()->getByName($name)->gatherMiddleware())
            ->toContain('auth', 'verified')
            ->not->toContain('no_banned_user');
    }

    $workflowRoutes = collect(Route::getRoutes()->getRoutes())
        ->filter(fn ($route) => $route->uri() === 'app/gigs/{gig}/workflow'
            && in_array('GET', $route->methods(), true));
    expect($workflowRoutes)->toHaveCount(1);
});

test('manual and automated bans share Indonesian actionable email notifications', function () {
    $manualUser = User::factory()->client()->create();
    $automaticUser = User::factory()->freelancer()->create();
    Queue::fake();

    app(BanService::class)->ban($manualUser, reason: 'Pelanggaran manual');
    app(BanService::class)->recordAutomated($automaticUser, 'Pelanggaran otomatis', 3);

    $notifications = Notification::query()->oldest('id')->get();
    expect($notifications)->toHaveCount(2)
        ->and($notifications[0]->title)->toBe('Akun Ditangguhkan')
        ->and($notifications[0]->body)->toContain('Pelanggaran manual', 'permanen')
        ->and($notifications[0]->action_url)->toBe(route('app.suspension'))
        ->and($notifications[0]->action_label)->toBe('Lihat Penangguhan')
        ->and($notifications[1]->title)->toBe('Akun Ditangguhkan')
        ->and($notifications[1]->body)->toContain('Pelanggaran otomatis', 'berakhir pada')
        ->and($notifications[1]->action_url)->toBe(route('app.suspension'))
        ->and($notifications[1]->action_label)->toBe('Lihat Penangguhan');
    Queue::assertPushed(SendMailJob::class, 2);
});

test('notification failure cannot undo committed settlement offense or ban', function () {
    $payment = GigPayment::factory()->paid()->create();
    $settlement = GigSettlement::factory()
        ->for($payment, 'payment')
        ->create(['gig_id' => $payment->gig_id]);
    $user = User::factory()->freelancer()->create();
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->once()
        ->andThrow(new RuntimeException('Notification unavailable.'));

    DB::transaction(function () use ($user, $settlement): void {
        $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
        app(GigOffenseService::class)->record($lockedUser, $settlement->gig);
    }, attempts: 3);

    expect($settlement->fresh())->not->toBeNull()
        ->and($user->gigOffenses()->count())->toBe(1)
        ->and($user->bans()->count())->toBe(1)
        ->and($user->activeBan()->exists())->toBeTrue();
});
