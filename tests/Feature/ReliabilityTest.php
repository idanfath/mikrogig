<?php

use App\Enums\OnboardingStep;
use App\Enums\UserRole;
use App\Events\NotificationReceived;
use App\Jobs\SendMailJob;
use App\Models\FreelancerProfile;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use App\Services\MailService;
use App\Services\UserAvatarService;
use Illuminate\Broadcasting\BroadcastEvent;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

uses(RefreshDatabase::class);

function reliabilityMailData(): array
{
    return MailService::buildEmailData('Test subject', 'Test body');
}

function reliabilityProfileData(): array
{
    return [
        'date_of_birth' => '1990-01-01',
        'province_id' => '11',
        'regency_id' => '1101',
        'title' => 'Laravel developer',
        'bio' => 'Builds reliable Laravel applications.',
        'skills' => ['Laravel', 'PHP'],
    ];
}

function freshMigrationCommandStarting(string $command = 'migrate:fresh'): CommandStarting
{
    return new CommandStarting($command, new ArrayInput([]), new BufferedOutput);
}

afterEach(function (): void {
    app()->detectEnvironment(fn (): string => 'testing');
});

test('notification broadcast job waits for commit', function () {
    $user = User::factory()->create();
    $notification = Notification::create([
        'created_by' => $user->id,
        'title' => 'Test notification',
        'body' => 'Test body',
        'target_type' => 'user',
    ]);
    $recipient = NotificationRecipient::create([
        'notification_id' => $notification->id,
        'user_id' => $user->id,
    ]);

    Queue::fake();

    DB::transaction(function () use ($recipient): void {
        broadcast(new NotificationReceived($recipient));

        Queue::assertNothingPushed();
    });

    Queue::assertPushed(BroadcastEvent::class);
});

test('resend success completes normally', function () {
    Http::preventStrayRequests();
    Http::fake(['api.resend.com/*' => Http::response(['id' => 'email_123'])]);

    $response = MailService::send('recipient@example.com', 'Test subject', reliabilityMailData());

    expect($response->successful())->toBeTrue();
    Http::assertSentCount(1);
});

test('transient resend failures retry and eventually throw', function () {
    Http::preventStrayRequests();
    Http::fake([
        'api.resend.com/*' => Http::sequence()
            ->push([], 500)
            ->push([], 500)
            ->push([], 500)
            ->push([], 500),
    ]);

    expect(fn () => MailService::send('recipient@example.com', 'Test subject', reliabilityMailData()))
        ->toThrow(RequestException::class);

    Http::assertSentCount(4);
});

test('non-transient resend client failures throw without retrying', function () {
    Http::preventStrayRequests();
    Http::fake(['api.resend.com/*' => Http::response([], 422)]);

    expect(fn () => MailService::send('recipient@example.com', 'Test subject', reliabilityMailData()))
        ->toThrow(RequestException::class);

    Http::assertSentCount(1);
});

test('mail job dispatches after commit with retry configuration', function () {
    $job = new SendMailJob('recipient@example.com', 'Test subject', reliabilityMailData());

    expect($job->afterCommit)->toBeTrue()
        ->and($job->timeout)->toBe(20)
        ->and($job->tries)->toBe(4)
        ->and($job->backoff)->toBe([10, 60, 300]);

});

test('freelancer onboarding completion updates all profile records', function () {
    $user = User::factory()->create([
        'role' => UserRole::Freelancer,
        'onboarding_step' => OnboardingStep::Profile,
    ]);

    $this->actingAs($user)
        ->post(route('onboarding.profile'), reliabilityProfileData())
        ->assertRedirect(route('app.home'));

    $user->refresh();
    $profile = $user->freelancerProfile;

    expect($user->date_of_birth?->toDateString())->toBe('1990-01-01')
        ->and($user->province_id)->toBe('11')
        ->and($user->regency_id)->toBe('1101')
        ->and($user->province_name)->toBe('ACEH')
        ->and($user->regency_name)->toBe('KABUPATEN SIMEULUE')
        ->and($user->onboarding_step)->toBeNull()
        ->and($profile?->title)->toBe('Laravel developer')
        ->and($profile?->skills)->toBe(['laravel', 'php']);
});

test('freelancer onboarding rolls back profile and user changes on failure', function () {
    $user = User::factory()->create([
        'role' => UserRole::Freelancer,
        'onboarding_step' => OnboardingStep::Profile,
        'date_of_birth' => '1980-01-01',
        'province_id' => 'old',
        'regency_id' => 'old',
        'province_name' => 'Old province',
        'regency_name' => 'Old regency',
    ]);
    $profile = $user->freelancerProfile()->create([
        'title' => 'Original title',
        'bio' => 'Original bio',
        'skills' => ['original'],
    ]);

    FreelancerProfile::updated(function (): void {
        throw new RuntimeException('Forced freelancer profile failure.');
    });

    try {
        $this->withoutExceptionHandling()
            ->actingAs($user)
            ->post(route('onboarding.profile'), reliabilityProfileData());
    } catch (RuntimeException $exception) {
        expect($exception->getMessage())->toBe('Forced freelancer profile failure.');
    } finally {
        FreelancerProfile::flushEventListeners();
    }

    $user->refresh();
    $profile->refresh();

    expect($user->date_of_birth?->toDateString())->toBe('1980-01-01')
        ->and($user->province_id)->toBe('old')
        ->and($user->regency_id)->toBe('old')
        ->and($user->onboarding_step)->toBe(OnboardingStep::Profile)
        ->and($profile->title)->toBe('Original title')
        ->and($profile->skills)->toBe(['original']);
});

test('avatar onboarding saves avatar and advances step together', function () {
    Storage::fake('cos');
    $user = User::factory()->create(['onboarding_step' => OnboardingStep::SetupAvatar]);

    $this->actingAs($user)
        ->post(route('onboarding.avatar'), [
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
        ])
        ->assertRedirect(route('onboarding'));

    $user->refresh();

    expect($user->avatar)->not->toBeNull()
        ->and($user->onboarding_step)->toBe(OnboardingStep::Profile);
    Storage::disk('cos')->assertExists($user->avatar);
});

test('failed COS writes preserve the existing avatar and onboarding step', function () {
    $user = User::factory()->create([
        'avatar' => 'avatars/old.jpg',
        'onboarding_step' => OnboardingStep::SetupAvatar,
    ]);
    $disk = Mockery::mock();
    $disk->shouldReceive('put')->once()->andReturnFalse();
    Storage::shouldReceive('disk')->once()->with('cos')->andReturn($disk);

    expect(fn () => app(UserAvatarService::class)->upload(
        $user,
        UploadedFile::fake()->image('avatar.jpg'),
    ))->toThrow(RuntimeException::class, 'Failed to store avatar.');

    $user->refresh();

    expect($user->avatar)->toBe('avatars/old.jpg')
        ->and($user->onboarding_step)->toBe(OnboardingStep::SetupAvatar);
});

test('avatar database-save failures clean up new objects and preserve the old avatar', function () {
    Storage::fake('cos');
    Storage::disk('cos')->put('avatars/old.jpg', 'old avatar');
    $user = User::factory()->create([
        'avatar' => 'avatars/old.jpg',
        'onboarding_step' => OnboardingStep::SetupAvatar,
    ]);

    User::saving(function (User $model): void {
        if ($model->isDirty('avatar')) {
            throw new RuntimeException('Forced user save failure.');
        }
    });

    try {
        expect(fn () => app(UserAvatarService::class)->upload(
            $user,
            UploadedFile::fake()->image('avatar.jpg'),
        ))->toThrow(RuntimeException::class, 'Forced user save failure.');
    } finally {
        User::flushEventListeners();
    }

    $user->refresh();

    expect($user->avatar)->toBe('avatars/old.jpg')
        ->and($user->onboarding_step)->toBe(OnboardingStep::SetupAvatar)
        ->and(Storage::disk('cos')->allFiles('avatars'))->toBe(['avatars/old.jpg']);
});

test('local fresh migrations delete user-content prefixes from COS', function () {
    app()->detectEnvironment(fn (): string => 'local');
    Storage::fake('cos');

    Storage::disk('cos')->put('avatars/user.jpg', 'avatar');
    Storage::disk('cos')->put('gigs/work.jpg', 'gig');
    Storage::disk('cos')->put('assets/defaults/default_avatar.jpg', 'default');

    Event::dispatch(freshMigrationCommandStarting());

    Storage::disk('cos')->assertDirectoryEmpty('avatars');
    Storage::disk('cos')->assertDirectoryEmpty('gigs');
    Storage::disk('cos')->assertExists('assets/defaults/default_avatar.jpg');
});

test('storage cleanup only runs for local fresh migrations', function (string $command, string $environment) {
    app()->detectEnvironment(fn (): string => $environment);
    Storage::fake('cos');

    Storage::disk('cos')->put('avatars/user.jpg', 'avatar');
    Storage::disk('cos')->put('gigs/work.jpg', 'gig');

    Event::dispatch(freshMigrationCommandStarting($command));

    Storage::disk('cos')->assertExists(['avatars/user.jpg', 'gigs/work.jpg']);
})->with([
    'non-local environment' => ['migrate:fresh', 'testing'],
    'different command' => ['migrate', 'local'],
]);

test('fresh migration stops when COS cleanup fails', function () {
    app()->detectEnvironment(fn (): string => 'local');

    $disk = Mockery::mock(FilesystemAdapter::class);
    $disk->shouldReceive('allFiles')
        ->once()
        ->with('avatars')
        ->andReturn(['avatars/user.jpg']);
    $disk->shouldReceive('delete')
        ->once()
        ->with('avatars/user.jpg')
        ->andReturnFalse();

    Storage::shouldReceive('disk')
        ->once()
        ->with('cos')
        ->andReturn($disk);

    $this->expectException(RuntimeException::class);
    $this->expectExceptionMessage('Failed to delete COS avatars/user.jpg.');

    Event::dispatch(freshMigrationCommandStarting());
});
