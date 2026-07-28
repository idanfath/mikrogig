<?php

use App\Models\User;
use App\Models\UserBan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('active scope keeps permanent and unexpired bans only', function () {
    $user = User::factory()->create();
    $admin = User::factory()->create();

    $permanent = UserBan::create([
        'user_id' => $user->id,
        'banned_by' => $admin->id,
        'reason' => 'permanent',
        'banned_at' => now(),
        'banned_until' => null,
        'unbanned_at' => null,
    ]);
    UserBan::create([
        'user_id' => $user->id,
        'banned_by' => $admin->id,
        'reason' => 'expired',
        'banned_at' => now()->subDay(),
        'banned_until' => now()->subHour(),
        'unbanned_at' => null,
    ]);
    UserBan::create([
        'user_id' => $user->id,
        'banned_by' => $admin->id,
        'reason' => 'lifted',
        'banned_at' => now(),
        'banned_until' => null,
        'unbanned_at' => now(),
    ]);
    $future = UserBan::create([
        'user_id' => $user->id,
        'banned_by' => $admin->id,
        'reason' => 'future',
        'banned_at' => now(),
        'banned_until' => now()->addDay(),
        'unbanned_at' => null,
    ]);

    $results = UserBan::query()->active()->orderBy('id')->get();

    expect($results->pluck('id')->all())
        ->toBe([$permanent->id, $future->id]);
});

test('user active ban relation uses active scope', function () {
    $user = User::factory()->create();
    $admin = User::factory()->create();

    UserBan::create([
        'user_id' => $user->id,
        'banned_by' => $admin->id,
        'reason' => 'old',
        'banned_at' => now()->subDay(),
        'banned_until' => now()->addDay(),
        'unbanned_at' => now()->subHour(),
    ]);
    $current = UserBan::create([
        'user_id' => $user->id,
        'banned_by' => $admin->id,
        'reason' => 'current',
        'banned_at' => now(),
        'banned_until' => now()->addDay(),
        'unbanned_at' => null,
    ]);

    expect($user->fresh()->activeBan?->is($current))
        ->toBeTrue()
        ->and($user->is_banned)
        ->toBeTrue();
});
