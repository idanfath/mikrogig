<?php

use App\Enums\UserRole;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserBan;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('user seeder is repeatable and creates deterministic verified accounts', function () {
    $this->seed(UserSeeder::class);
    $this->seed(UserSeeder::class);

    $emails = [
        'admin@example.com',
        'freelancer@example.com',
        'client@example.com',
        'dummy.freelancer1@example.com',
        'dummy.freelancer2@example.com',
        'dummy.freelancer3@example.com',
        'dummy.client1@example.com',
        'dummy.client2@example.com',
        'dummy.client3@example.com',
    ];

    expect(User::query()->whereIn('email', $emails)->count())->toBe(9)
        ->and(User::query()->whereIn('email', $emails)->distinct('email')->count('email'))->toBe(9);

    foreach ([
        'admin@example.com' => UserRole::Admin,
        'freelancer@example.com' => UserRole::Freelancer,
        'client@example.com' => UserRole::Client,
    ] as $email => $role) {
        $user = User::query()->where('email', $email)->firstOrFail();

        expect($user->role)->toBe($role)
            ->and($user->email_verified_at)->not->toBeNull()
            ->and($user->onboarding_step)->toBeNull()
            ->and(Hash::check('password', $user->password))->toBeTrue();
    }
});

test('normal seed creates only inactive historical bans without notifications', function () {
    $this->seed(DatabaseSeeder::class);

    $ban = UserBan::query()->with('user')->sole();

    expect($ban->user->email)->toBe('dummy.client3@example.com')
        ->and($ban->isActive())->toBeFalse()
        ->and(UserBan::query()->active()->exists())->toBeFalse()
        ->and(UserBan::query()->whereHas('user', fn ($query) => $query->whereIn('email', [
            'admin@example.com',
            'freelancer@example.com',
            'client@example.com',
        ]))->exists())->toBeFalse()
        ->and(Notification::query()->count())->toBe(0);
});
