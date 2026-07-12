<?php

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\URL;

uses(LazilyRefreshDatabase::class);

test('guest can verify email with signed url', function () {
    $user = User::factory()->unverified()->create();

    $url = URL::temporarySignedRoute(
        'verification.verify',
        Carbon::now()->addMinutes(60),
        ['user' => $user->id, 'hash' => sha1($user->email)]
    );

    $response = $this->get($url);

    $response->assertRedirect(route('dashboard'));
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});
test('guest cannot verify email with invalid signature', function () {
    $user = User::factory()->unverified()->create();

    $url = URL::temporarySignedRoute(
        'verification.verify',
        Carbon::now()->addMinutes(60),
        ['user' => $user->id, 'hash' => sha1($user->email)]
    );

    // Tamper with URL
    $tamperedUrl = $url.'extra';

    $response = $this->get($tamperedUrl);

    $response->assertStatus(403);
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('authenticated user is logged out before verification', function () {
    $user = User::factory()->unverified()->create();

    $url = URL::temporarySignedRoute(
        'verification.verify',
        Carbon::now()->addMinutes(60),
        ['user' => $user->id, 'hash' => sha1($user->email)]
    );

    // Simulate accessing a protected route which triggers Verified middleware
    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertRedirect();
    $this->assertGuest();

    // Now verify as guest
    $response = $this->get($url);
    $response->assertRedirect(route('dashboard'));
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});
test('guest can see verification notice with signed url', function () {
    $user = User::factory()->unverified()->create();

    $url = URL::signedRoute('verification.notice', ['user' => $user->id]);

    $response = $this->get($url);

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('auth/verification/notice'));
});
