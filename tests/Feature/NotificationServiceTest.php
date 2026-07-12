<?php

use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use App\Jobs\SendMailJob;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(NotificationService::class);
    $this->admin = User::factory()->create(['role' => UserRole::Admin->value]);
});

it('can send a notification to everyone', function () {
    Bus::fake();
    User::factory()->count(5)->create();

    $this->service->send(
        createdBy: $this->admin->id,
        title: 'Global News',
        targetType: NotificationTargetType::Everyone,
        body: 'Hello everyone!',
        sendEmail: true
    );

    expect(Notification::count())->toBe(1);
    // 5 created + 1 admin = 6
    expect(NotificationRecipient::count())->toBe(6);
    Bus::assertDispatched(SendMailJob::class, 6);
});

it('can send a notification to a specific role', function () {
    Bus::fake();
    User::factory()->count(3)->create(['role' => UserRole::User->value]);
    User::factory()->count(2)->create(['role' => UserRole::Admin->value]);

    $this->service->send(
        createdBy: $this->admin->id,
        title: 'Admin Only',
        targetType: NotificationTargetType::Role,
        role: UserRole::Admin->value,
        body: 'Secret stuff'
    );

    // 1 admin (pre-created) + 2 admins created = 3
    expect(NotificationRecipient::count())->toBe(3);
});

it('can send a notification to specific users', function () {
    $users = User::factory()->count(5)->create();
    $recipientIds = $users->take(2)->pluck('id')->toArray();

    $this->service->send(
        createdBy: $this->admin->id,
        title: 'Direct Message',
        targetType: NotificationTargetType::Users,
        recipientIds: $recipientIds,
        body: 'For your eyes only'
    );

    expect(NotificationRecipient::count())->toBe(2);
    foreach ($recipientIds as $id) {
        expect(NotificationRecipient::where('user_id', $id)->exists())->toBeTrue();
    }
});

it('can fetch inbox for a user', function () {
    $user = User::factory()->create();
    
    // Create some notifications with explicit sleep or IDs to ensure ordering
    for ($i = 0; $i < 3; $i++) {
        $notification = Notification::create([
            'created_by' => $this->admin->id,
            'title' => "News $i",
            'body' => "Body $i",
            'target_type' => NotificationTargetType::Everyone->value,
        ]);
        NotificationRecipient::create([
            'notification_id' => $notification->id,
            'user_id' => $user->id,
        ]);
    }

    $inbox = $this->service->inbox($user->id);

    expect($inbox->total())->toBe(3);
    // Should be descending order (News 2 is latest)
    expect($inbox->items()[0]['title'])->toBe('News 2'); 
});

it('can mark a notification as read', function () {
    $user = User::factory()->create();
    $notification = Notification::create([
        'created_by' => $this->admin->id,
        'title' => 'Unread News',
        'body' => 'Test body',
        'target_type' => NotificationTargetType::Everyone->value,
    ]);
    NotificationRecipient::create([
        'notification_id' => $notification->id,
        'user_id' => $user->id,
    ]);

    expect($this->service->unreadCount($user->id))->toBe(1);

    $this->service->markRead($user->id, $notification->id);

    expect($this->service->unreadCount($user->id))->toBe(0);
});

it('can mark all notifications as read', function () {
    $user = User::factory()->create();
    
    for ($i = 0; $i < 5; $i++) {
        $notification = Notification::create([
            'created_by' => $this->admin->id,
            'title' => "News $i",
            'body' => "Body $i",
            'target_type' => NotificationTargetType::Everyone->value,
        ]);
        NotificationRecipient::create([
            'notification_id' => $notification->id,
            'user_id' => $user->id,
        ]);
    }

    expect($this->service->unreadCount($user->id))->toBe(5);

    $this->service->markAllAsRead($user->id);

    expect($this->service->unreadCount($user->id))->toBe(0);
});
