<?php

use App\Enums\NotificationCategory;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(LazilyRefreshDatabase::class);

function notificationFor(User $user, NotificationCategory $category): Notification
{
    $notification = Notification::query()->create([
        'title' => $category === NotificationCategory::Chat ? 'Pesan Baru' : 'Aktivitas Baru',
        'body' => 'Isi notifikasi.',
        'category' => $category,
    ]);
    $notification->recipients()->create(['user_id' => $user->id]);

    return $notification;
}

test('notification inbox filters chat messages separately from system activity', function () {
    $user = User::factory()->create(['onboarding_step' => null]);
    $chat = notificationFor($user, NotificationCategory::Chat);
    notificationFor($user, NotificationCategory::System);

    $this->actingAs($user)
        ->get(route('app.notifications', ['category' => NotificationCategory::Chat->value]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/notifications')
            ->where('filters.category', NotificationCategory::Chat->value)
            ->has('inbox.data', 1)
            ->where('inbox.data.0.id', $chat->id)
            ->where('inbox.data.0.category', NotificationCategory::Chat->value));
});
