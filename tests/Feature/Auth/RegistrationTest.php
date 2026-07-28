<?php

use App\Jobs\SendMailJob;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

test('normal signup creates user, dispatches verification email, and sends welcome notification', function () {
    Queue::fake();

    $response = $this->post('/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertRedirect();

    $user = User::where('email', 'john@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasVerifiedEmail())->toBeFalse();

    Queue::assertPushed(SendMailJob::class);

    $recipient = NotificationRecipient::where('user_id', $user->id)->first();
    expect($recipient)->not->toBeNull();

    $notification = Notification::find($recipient->notification_id);
    expect($notification->title)->toBe('Selamat Bergabung!');
});

test('new google signup creates user, skips email verification, and sends welcome plus password setup notifications', function () {
    Queue::fake();

    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-12345');
    $abstractUser->shouldReceive('getName')->andReturn('Google User');
    $abstractUser->shouldReceive('getEmail')->andReturn('googleuser@gmail.com');
    $abstractUser->shouldReceive('getAvatar')->andReturn(null);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get('/auth/google/callback');
    $response->assertRedirect();

    $user = User::where('email', 'googleuser@gmail.com')->first();
    expect($user)->not->toBeNull();
    expect($user->google_id)->toBe('google-12345');
    expect($user->hasVerifiedEmail())->toBeTrue();

    Queue::assertNotPushed(SendMailJob::class);

    $notifications = Notification::join('notification_recipients', 'notifications.id', '=', 'notification_recipients.notification_id')
        ->where('notification_recipients.user_id', $user->id)
        ->pluck('title')
        ->all();

    expect($notifications)->toContain('Selamat Bergabung!');
    expect($notifications)->toContain('Atur Kata Sandi Anda');
});

test('returning google login authenticates user without creating new notifications', function () {
    $existingUser = User::factory()->create([
        'email' => 'returning@gmail.com',
        'google_id' => 'google-67890',
        'email_verified_at' => now(),
    ]);

    $initialNotificationCount = NotificationRecipient::where('user_id', $existingUser->id)->count();

    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-67890');
    $abstractUser->shouldReceive('getName')->andReturn($existingUser->name);
    $abstractUser->shouldReceive('getEmail')->andReturn($existingUser->email);
    $abstractUser->shouldReceive('getAvatar')->andReturn(null);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get('/auth/google/callback');
    $response->assertRedirect();

    $this->assertAuthenticatedAs($existingUser);

    $newNotificationCount = NotificationRecipient::where('user_id', $existingUser->id)->count();
    expect($newNotificationCount)->toBe($initialNotificationCount);
});

test('direct user creation does not trigger notifications or email side effects', function () {
    Queue::fake();

    $user = User::create([
        'name' => 'Direct User',
        'email' => 'direct@domain.com',
        'password' => bcrypt('password'),
    ]);

    expect($user->exists)->toBeTrue();
    Queue::assertNothingPushed();
    expect(NotificationRecipient::where('user_id', $user->id)->count())->toBe(0);
});
