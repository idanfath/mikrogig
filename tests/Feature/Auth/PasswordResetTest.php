<?php

use App\Jobs\SendMailJob;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function passwordResetPayload(User $user, string $token, array $overrides = []): array
{
    return array_merge([
        'token' => $token,
        'email' => $user->email,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ], $overrides);
}

function insertSession(string $id, int $userId): void
{
    DB::table('sessions')->insert([
        'id' => $id,
        'user_id' => $userId,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Pest',
        'payload' => 'payload',
        'last_activity' => now()->timestamp,
    ]);
}

test('existing email creates a broker token and queues the custom reset email', function () {
    Queue::fake();
    $user = User::factory()->create(['email' => 'existing@example.com']);

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.11'])
        ->from('/password/forgot')
        ->post('/password/forgot', ['email' => $user->email])
        ->assertRedirect('/password/forgot')
        ->assertSessionHas('success', 'Link reset password telah dikirim.');

    $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
    Queue::assertPushed(SendMailJob::class, fn (SendMailJob $job): bool => $job->to === $user->email);
});

test('unknown email receives the same response without a broker token', function () {
    Queue::fake();

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.12'])
        ->from('/password/forgot')
        ->post('/password/forgot', ['email' => 'unknown@example.com'])
        ->assertRedirect('/password/forgot')
        ->assertSessionHas('success', 'Link reset password telah dikirim.');

    $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'unknown@example.com']);
    Queue::assertNothingPushed();
});

test('valid token resets password, revokes old sessions, and authenticates a fresh session', function () {
    $user = User::factory()->create([
        'onboarding_step' => null,
        'remember_token' => 'old-remember-token',
    ]);
    $otherUser = User::factory()->create();
    $token = Password::createToken($user);
    insertSession('reset-user-session', $user->id);
    insertSession('other-user-session', $otherUser->id);

    Event::fake([PasswordReset::class]);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.13'])
        ->from('/password/reset/'.$token.'?email='.$user->email)
        ->post('/password/reset', passwordResetPayload($user, $token));

    $response
        ->assertRedirect(route('app.home'))
        ->assertSessionHas('success', 'Password berhasil direset!')
        ->assertSessionHas(Auth::getName(), $user->id);
    $this->assertAuthenticatedAs($user);

    $user->refresh();

    expect(Hash::check('new-password', $user->password))->toBeTrue()
        ->and($user->remember_token)->not->toBe('old-remember-token');
    $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
    $this->assertDatabaseMissing('sessions', ['id' => 'reset-user-session']);
    $this->assertDatabaseHas('sessions', ['id' => 'other-user-session']);
    Event::assertDispatched(PasswordReset::class, fn (PasswordReset $event): bool => $event->user->is($user));
});

test('replayed tokens fail without changing credentials or sessions', function () {
    $user = User::factory()->create(['onboarding_step' => null]);
    $token = Password::createToken($user);
    Password::deleteToken($user);
    insertSession('replayed-token-session', $user->id);
    $oldPassword = $user->password;

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.14'])
        ->from('/password/reset/'.$token.'?email='.$user->email)
        ->post('/password/reset', passwordResetPayload($user, $token))
        ->assertRedirect('/password/reset/'.$token.'?email='.$user->email)
        ->assertSessionHas('error', 'Gagal mereset password.');

    expect($user->fresh()->password)->toBe($oldPassword);
    $this->assertDatabaseHas('sessions', ['id' => 'replayed-token-session']);
});

test('expired tokens fail without changing credentials or sessions', function () {
    $user = User::factory()->create(['onboarding_step' => null]);
    $token = Password::createToken($user);
    DB::table('password_reset_tokens')
        ->where('email', $user->email)
        ->update(['created_at' => now()->subMinutes(61)]);
    insertSession('expired-token-session', $user->id);
    $oldPassword = $user->password;

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.15'])
        ->from('/password/reset/'.$token.'?email='.$user->email)
        ->post('/password/reset', passwordResetPayload($user, $token))
        ->assertRedirect('/password/reset/'.$token.'?email='.$user->email)
        ->assertSessionHas('error', 'Gagal mereset password.');

    expect($user->fresh()->password)->toBe($oldPassword);
    $this->assertDatabaseHas('sessions', ['id' => 'expired-token-session']);
});

test('random tokens fail without changing credentials or sessions', function () {
    $user = User::factory()->create(['onboarding_step' => null]);
    insertSession('random-token-session', $user->id);
    $oldPassword = $user->password;

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.16'])
        ->from('/password/reset/random-token?email='.$user->email)
        ->post('/password/reset', passwordResetPayload($user, 'random-token'))
        ->assertRedirect('/password/reset/random-token?email='.$user->email)
        ->assertSessionHas('error', 'Gagal mereset password.');

    expect($user->fresh()->password)->toBe($oldPassword);
    $this->assertDatabaseHas('sessions', ['id' => 'random-token-session']);
});

test('email-mismatched tokens fail without changing credentials or sessions', function () {
    $user = User::factory()->create(['onboarding_step' => null]);
    $otherUser = User::factory()->create(['onboarding_step' => null]);
    $token = Password::createToken($user);
    insertSession('mismatched-token-session', $user->id);
    $oldPassword = $user->password;

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.17'])
        ->from('/password/reset/'.$token.'?email='.$otherUser->email)
        ->post('/password/reset', passwordResetPayload($otherUser, $token))
        ->assertRedirect('/password/reset/'.$token.'?email='.$otherUser->email)
        ->assertSessionHas('error', 'Gagal mereset password.');

    expect($user->fresh()->password)->toBe($oldPassword);
    $this->assertDatabaseHas('sessions', ['id' => 'mismatched-token-session']);
});

test('password reset keeps password strength and confirmation validation', function () {
    config(['app.env' => 'production']);
    $user = User::factory()->create(['onboarding_step' => null]);
    $token = Password::createToken($user);
    $oldPassword = $user->password;

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.18'])
        ->from('/password/reset/'.$token.'?email='.$user->email)
        ->post('/password/reset', passwordResetPayload($user, $token, [
            'password' => 'short',
            'password_confirmation' => 'different',
        ]))
        ->assertRedirect('/password/reset/'.$token.'?email='.$user->email)
        ->assertSessionHasErrors('password');

    expect($user->fresh()->password)->toBe($oldPassword);
});

test('reset page provides token and email props', function () {
    $this->get('/password/reset/example-token?email=reset@example.com')
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/passwordReset')
            ->where('token', 'example-token')
            ->where('email', 'reset@example.com'));
});
