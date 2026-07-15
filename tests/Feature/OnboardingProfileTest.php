<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('profile setup stores canonical Indonesian location', function () {
    /** @var User $user */
    $user = User::factory()->create([
        'role' => UserRole::Client,
        'onboarding_step' => 'profile',
    ]);

    $this
        ->actingAs($user)
        ->post(route('onboarding.profile'), [
            'title' => '',
            'bio' => '',
            'skills' => [],
            'date_of_birth' => '2000-01-01',
            'province_id' => '31',
            'province_name' => 'DKI JAKARTA',
            'regency_id' => '3174',
            'regency_name' => 'KOTA JAKARTA SELATAN',
        ])
        ->assertRedirect(route('dashboard'));

    $user->refresh();

    expect($user->location)
        ->toBe('KOTA JAKARTA SELATAN, DKI JAKARTA')
        ->and($user->province_id)
        ->toBe('31')
        ->and($user->regency_id)
        ->toBe('3174')
        ->and($user->onboarding_step)
        ->toBeNull();
});
