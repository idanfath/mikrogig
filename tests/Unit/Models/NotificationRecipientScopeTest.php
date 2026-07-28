<?php

use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('for user and unread scopes filter recipients', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $notification = Notification::create([
        'created_by' => $user->id,
        'title' => 'Hello',
        'body' => 'World',
        'target_type' => 'user',
    ]);

    $unread = NotificationRecipient::create([
        'notification_id' => $notification->id,
        'user_id' => $user->id,
    ]);
    NotificationRecipient::create([
        'notification_id' => $notification->id,
        'user_id' => $other->id,
        'read_at' => now(),
    ]);

    $results = NotificationRecipient::query()
        ->forUser($user->id)
        ->unread()
        ->get();

    expect($results)
        ->toHaveCount(1)
        ->and($results->first()->is($unread))
        ->toBeTrue();
});

test('for notification scope filters by notification id', function () {
    $user = User::factory()->create();
    $first = Notification::create([
        'created_by' => $user->id,
        'title' => 'First',
        'body' => 'A',
        'target_type' => 'user',
    ]);
    $second = Notification::create([
        'created_by' => $user->id,
        'title' => 'Second',
        'body' => 'B',
        'target_type' => 'user',
    ]);

    NotificationRecipient::create([
        'notification_id' => $first->id,
        'user_id' => $user->id,
    ]);
    $match = NotificationRecipient::create([
        'notification_id' => $second->id,
        'user_id' => $user->id,
    ]);

    $results = NotificationRecipient::query()
        ->forUser($user->id)
        ->forNotification($second->id)
        ->get();

    expect($results)
        ->toHaveCount(1)
        ->and($results->first()->is($match))
        ->toBeTrue();
});
