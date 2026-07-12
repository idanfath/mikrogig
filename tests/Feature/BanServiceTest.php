<?php

use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\User;
use App\Models\UserBan;
use App\Services\BanService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
  // We mock NotificationService to verify that notifications are sent
  // without actually executing the complex notification logic.
  $this->notificationMock = Mockery::mock(NotificationService::class);
  $this->app->instance(NotificationService::class, $this->notificationMock);

  $this->service = app(BanService::class);

  $this->admin = User::factory()->create(['role' => UserRole::Admin->value]);
  $this->target = User::factory()->create(['role' => UserRole::User->value]);
});

it('can ban a user', function () {
  $reason = 'Violating community guidelines';
  $until = now()->addDays(7);

  // Assert notification is sent
  $this
    ->notificationMock
    ->shouldReceive('send')
    ->once()
    ->withArgs(function ($title, $targetType, $createdBy, $body, $recipientIds, $role, $action_url, $action_label, $sendEmail) use ($reason) {
      return $createdBy === $this->admin->id &&
        $title === 'You have been banned' &&
        $targetType === NotificationTargetType::User &&
        str_contains($body, $reason) &&
        $recipientIds === [$this->target->id];
    });

  $ban = $this->service->ban($this->target, $this->admin, $reason, $until);

  expect($ban)->toBeInstanceOf(UserBan::class);
  expect($ban->user_id)->toBe($this->target->id);
  expect($ban->reason)->toBe($reason);
  expect($ban->banned_until->toDateTimeString())->toBe($until->toDateTimeString());

  // Check user state
  expect($this->target->refresh()->is_banned)->toBeTrue();
});

it('throws an exception when banning self', function () {
  expect(fn() => $this->service->ban($this->admin, $this->admin, 'Self ban'))
    ->toThrow(\Exception::class, 'You cannot ban yourself.');
});

it('throws an exception when user is already banned', function () {
  UserBan::create([
    'user_id' => $this->target->id,
    'banned_by' => $this->admin->id,
    'reason' => 'Existing ban',
    'banned_at' => now(),
  ]);

  expect(fn() => $this->service->ban($this->target, $this->admin, 'Double ban'))
    ->toThrow(\Exception::class, 'User is already banned.');
});

it('can unban a user', function () {
  UserBan::create([
    'user_id' => $this->target->id,
    'banned_by' => $this->admin->id,
    'reason' => 'Banned',
    'banned_at' => now(),
  ]);

  expect($this->target->refresh()->is_banned)->toBeTrue();

  // Assert notification is sent
  $this
    ->notificationMock
    ->shouldReceive('send')
    ->once()
    ->withArgs(function ($title, $targetType, $createdBy, $body, $recipientIds) {
      return $title === 'Your ban has been lifted' &&
        $recipientIds === [$this->target->id];
    });

  $result = $this->service->unban($this->target, $this->admin);

  expect($result)->toBeTrue();
  expect($this->target->refresh()->is_banned)->toBeFalse();

  $ban = UserBan::where('user_id', $this->target->id)->first();
  expect($ban->unbanned_at)->not->toBeNull();
  expect($ban->unbanned_by)->toBe($this->admin->id);
});

it('can extend a ban', function () {
  UserBan::create([
    'user_id' => $this->target->id,
    'banned_by' => $this->admin->id,
    'reason' => 'Banned',
    'banned_at' => now(),
    'banned_until' => now()->addDays(1),
  ]);

  $newUntil = now()->addDays(10);

  // Assert notification is sent
  $this
    ->notificationMock
    ->shouldReceive('send')
    ->once()
    ->withArgs(function ($title, $targetType, $createdBy, $body, $recipientIds) {
      return $title === 'Your ban has been extended' &&
        $recipientIds === [$this->target->id];
    });

  $result = $this->service->extend(target: $this->target, admin: $this->admin, newUntil: $newUntil);

  expect($result)->toBeTrue();

  $ban = $this->target->activeBan;
  expect($ban->banned_until->toDateTimeString())->toBe($newUntil->toDateTimeString());
});

it('throws exception when extending non-existent ban', function () {
  expect(fn() => $this->service->extend(
    $this->target,
    now()->addDays(1),
    $this->admin
  ))
    ->toThrow(\Exception::class, 'User has no active ban to extend.');
});
