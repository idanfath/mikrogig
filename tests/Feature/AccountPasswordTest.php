<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
  $this->withoutVite();
});

test('guest cannot view account page', function () {
  $this->get(route('app.account'))->assertRedirect(route('login'));
});

test('authenticated user can view account page', function () {
  $user = User::factory()->create([
    'onboarding_step' => null,
  ]);

  $this
    ->actingAs($user)
    ->get(route('app.account'))
    ->assertSuccessful()
    ->assertInertia(fn($page) => $page
      ->component('app/user/account')
      ->where('hasPassword', true));
});

test('user without password sees hasPassword false', function () {
  $user = User::factory()->withoutPassword()->create([
    'onboarding_step' => null,
  ]);

  $this
    ->actingAs($user)
    ->get(route('app.account'))
    ->assertSuccessful()
    ->assertInertia(fn($page) => $page
      ->component('app/user/account')
      ->where('hasPassword', false));
});

test('wrong current password fails', function () {
  $user = User::factory()->create([
    'onboarding_step' => null,
    'password' => 'password',
  ]);

  $this
    ->actingAs($user)
    ->from(route('app.account'))
    ->put(route('app.account.password'), [
      'current_password' => 'wrong-password',
      'password' => 'new-password-123',
      'password_confirmation' => 'new-password-123',
    ])
    ->assertRedirect(route('app.account'))
    ->assertSessionHasErrors('current_password');

  expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('user can change password with correct current password', function () {
  $user = User::factory()->create([
    'onboarding_step' => null,
    'password' => 'password',
  ]);

  $this
    ->actingAs($user)
    ->from(route('app.account'))
    ->put(route('app.account.password'), [
      'current_password' => 'password',
      'password' => 'new-password-123',
      'password_confirmation' => 'new-password-123',
    ])
    ->assertRedirect(route('app.account'))
    ->assertSessionHas('success');

  expect(Hash::check('new-password-123', $user->fresh()->password))->toBeTrue();
});

test('user without password can set password', function () {
  $user = User::factory()->withoutPassword()->create([
    'onboarding_step' => null,
  ]);

  $this
    ->actingAs($user)
    ->from(route('app.account'))
    ->put(route('app.account.password'), [
      'password' => 'new-password-123',
      'password_confirmation' => 'new-password-123',
    ])
    ->assertRedirect(route('app.account'))
    ->assertSessionHas('success');

  expect(Hash::check('new-password-123', $user->fresh()->password))->toBeTrue();
});

test('password confirmation mismatch fails', function () {
  $user = User::factory()->create([
    'onboarding_step' => null,
    'password' => 'password',
  ]);

  $this
    ->actingAs($user)
    ->from(route('app.account'))
    ->put(route('app.account.password'), [
      'current_password' => 'password',
      'password' => 'new-password-123',
      'password_confirmation' => 'different-password',
    ])
    ->assertRedirect(route('app.account'))
    ->assertSessionHasErrors('password');
});

test('user without password cannot send current_password', function () {
  $user = User::factory()->withoutPassword()->create([
    'onboarding_step' => null,
  ]);

  $this
    ->actingAs($user)
    ->from(route('app.account'))
    ->put(route('app.account.password'), [
      'current_password' => 'anything',
      'password' => 'new-password-123',
      'password_confirmation' => 'new-password-123',
    ])
    ->assertRedirect(route('app.account'))
    ->assertSessionHasErrors('current_password');
});
