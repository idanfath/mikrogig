<?php

use App\Actions\Gig\SendGigMessage;
use App\Enums\GigMessageKind;
use App\Enums\GigStatus;
use App\Enums\GigWorkflowEvent;
use App\Enums\NotificationTargetType;
use App\Enums\UserRole;
use App\Events\GigMessageCreated;
use App\Events\GigMessagesRead;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigMessage;
use App\Models\GigOffer;
use App\Models\User;
use App\Models\UserBan;
use App\Services\GigConversationService;
use App\Services\NotificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

beforeEach(function () {
    Storage::fake('cos-private');
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->zeroOrMoreTimes()
        ->shouldReceive('unreadCount')
        ->zeroOrMoreTimes()
        ->andReturn(0);
});

function conversationAttempt(GigStatus $status = GigStatus::AgreementPreparation): array
{
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create(['status' => $status]);
    $offer = GigOffer::factory()
        ->for($gig)
        ->for($freelancer, 'freelancer')
        ->accepted()
        ->create();
    $agreement = GigAgreement::factory()
        ->for($gig)
        ->for($offer, 'acceptedOffer')
        ->create();

    return [$client, $freelancer, $gig, $offer, $agreement];
}

test('message relationships casts immutability ordering and unique event keys', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt();
    $message = GigMessage::factory()
        ->for($agreement, 'agreement')
        ->for($client, 'sender')
        ->for($freelancer, 'recipient')
        ->create();

    $message->media()->createMany([
        ['path' => 'gig-messages/b.webp', 'mime_type' => 'image/webp', 'display_order' => 1],
        ['path' => 'gig-messages/a.jpg', 'mime_type' => 'image/jpeg', 'display_order' => 0],
    ]);

    expect($message->kind)->toBe(GigMessageKind::User)
        ->and($message->agreement->is($agreement))->toBeTrue()
        ->and($message->sender->is($client))->toBeTrue()
        ->and($message->recipient->is($freelancer))->toBeTrue()
        ->and($message->media->pluck('display_order')->all())->toBe([0, 1])
        ->and(fn () => $message->update(['body' => 'changed']))->toThrow(LogicException::class)
        ->and(fn () => $message->delete())->toThrow(LogicException::class);

    app(GigConversationService::class)->record(
        $agreement,
        GigWorkflowEvent::FreelancerSelected,
        "agreement:{$agreement->id}:selected",
    );

    expect($agreement->messages()->where('event_key', "agreement:{$agreement->id}:selected")->count())->toBe(1);
});

test('each winner attempt owns a separate conversation', function () {
    [$client, $firstFreelancer, $gig, $firstOffer, $firstAgreement] = conversationAttempt();
    $firstAgreement->forceFill(['closed_at' => now()])->save();
    $secondFreelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $secondOffer = GigOffer::factory()
        ->for($gig)
        ->for($secondFreelancer, 'freelancer')
        ->accepted()
        ->create();
    $secondAgreement = GigAgreement::factory()
        ->for($gig)
        ->for($secondOffer, 'acceptedOffer')
        ->create();

    GigMessage::factory()->for($firstAgreement, 'agreement')->for($client, 'sender')->for($firstFreelancer, 'recipient')->create(['body' => 'old']);
    GigMessage::factory()->for($secondAgreement, 'agreement')->for($client, 'sender')->for($secondFreelancer, 'recipient')->create(['body' => 'new']);

    expect($firstAgreement->messages()->where('body', 'old')->exists())->toBeTrue()
        ->and($firstAgreement->messages()->where('body', 'new')->exists())->toBeFalse()
        ->and($secondAgreement->messages()->where('body', 'new')->exists())->toBeTrue();
});

test('agreement event snapshots preserve the exact submitted version', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt();
    $agreement->forceFill([
        'terms_version' => 1,
        'final_scope' => 'Scope version one',
        'final_total_price' => 123_456,
        'submitted_at' => now(),
    ])->save();

    $event = $agreement->messages()
        ->where('workflow_event', GigWorkflowEvent::AgreementTermsSubmitted)
        ->sole();

    $agreement->forceFill([
        'terms_version' => 2,
        'final_scope' => 'Scope version two',
        'final_total_price' => 654_321,
        'submitted_at' => now()->addMinute(),
    ])->save();

    expect($event->fresh()->event_snapshot['terms_version'])->toBe(1)
        ->and($event->fresh()->event_snapshot['final_scope'])->toBe('Scope version one')
        ->and($event->fresh()->event_snapshot['final_total_price'])->toBe(123_456)
        ->and($agreement->messages()
            ->where('workflow_event', GigWorkflowEvent::AgreementTermsSubmitted)
            ->count())->toBe(2);
});

test('participants can send text images or both in every writable state', function (GigStatus $status) {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt($status);
    $action = app(SendGigMessage::class);

    $text = $action->execute($client, $agreement, '  Halo  ', []);
    $image = $action->execute($freelancer, $agreement, null, [
        UploadedFile::fake()->image('proof.jpg', 100, 100),
    ]);
    $combined = $action->execute($client, $agreement, 'Lihat ini', [
        UploadedFile::fake()->image('context.png', 100, 100),
    ]);

    expect($text->body)->toBe('Halo')
        ->and($image->media)->toHaveCount(1)
        ->and($combined->media)->toHaveCount(1)
        ->and(Storage::disk('cos-private')->exists($image->media->first()->path))->toBeTrue();
})->with([
    GigStatus::AgreementPreparation,
    GigStatus::LockPending,
    GigStatus::PaymentPending,
    GigStatus::Locked,
    GigStatus::InProgress,
    GigStatus::Review,
]);

test('empty invalid and oversized message payloads are rejected without stored files', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt();
    $action = app(SendGigMessage::class);

    expect(fn () => $action->execute($client, $agreement, ' ', []))->toThrow(DomainException::class)
        ->and(fn () => $action->execute($client, $agreement, str_repeat('a', 2001), []))->toThrow(DomainException::class)
        ->and(fn () => $action->execute($client, $agreement, null, [
            UploadedFile::fake()->create('bad.gif', 20, 'image/gif'),
        ]))->toThrow(DomainException::class)
        ->and(Storage::disk('cos-private')->allFiles('gig-messages'))->toBe([]);
});

test('unrelated users previous winners admins and banned participants cannot send', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt();
    $unrelated = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $admin = User::factory()->create(['role' => UserRole::Admin, 'onboarding_step' => null]);
    $action = app(SendGigMessage::class);

    expect(fn () => $action->execute($unrelated, $agreement, 'No', []))
        ->toThrow(AuthorizationException::class)
        ->and(fn () => $action->execute($admin, $agreement, 'No', []))
        ->toThrow(AuthorizationException::class);

    UserBan::query()->create([
        'user_id' => $freelancer->id,
        'reason' => 'Test suspension',
        'banned_at' => now(),
        'banned_until' => now()->addDay(),
        'unbanned_at' => null,
    ]);
    expect(fn () => $action->execute($freelancer->fresh(), $agreement, 'No', []))
        ->toThrow(DomainException::class);

    $agreement->forceFill(['closed_at' => now()])->save();
    expect(fn () => $action->execute($client, $agreement, 'No', []))
        ->toThrow(DomainException::class);
});

test('all read only and terminal states reject sending', function (GigStatus $status) {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt($status);

    expect(fn () => app(SendGigMessage::class)->execute($client, $agreement, 'No', []))
        ->toThrow(DomainException::class);
})->with([
    GigStatus::Open,
    GigStatus::Disputed,
    GigStatus::Completed,
    GigStatus::Cancelled,
    GigStatus::DisputeResolved,
]);

test('participant notification uses stable destination and failure cannot roll back message', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt();
    $notifications = mock(NotificationService::class);
    $notifications->shouldReceive('send')->once()->withArgs(
        fn (
            string $title,
            NotificationTargetType $targetType,
            int $createdBy,
            string $body,
            array $recipientIds,
            ?string $role,
            string $actionUrl,
            string $actionLabel,
            bool $sendEmail = false,
        ): bool => $title === "Pesan Baru dari {$client->name}"
            && $targetType === NotificationTargetType::User
            && $createdBy === $client->id
            && $body === "{$client->name} mengirimkan pesan baru pada workflow gig \"{$gig->title}\"."
            && $recipientIds === [$freelancer->id]
            && $role === null
            && $actionUrl === route('app.gig_conversations.show', $agreement)
            && $actionLabel === 'Buka Percakapan'
            && $sendEmail === false,
    )->andThrow(new RuntimeException('notification unavailable'));
    $notifications->shouldReceive('unreadCount')->zeroOrMoreTimes()->andReturn(0);

    $message = app(SendGigMessage::class)->execute($client, $agreement, 'Halo', []);

    expect($message->exists)->toBeTrue()
        ->and(GigMessage::query()->where('body', 'Halo')->exists())->toBeTrue();
});

test('message broadcasts use the presence channel and system cards send a refresh signal', function () {
    Event::fake([GigMessageCreated::class]);
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt();

    $message = app(SendGigMessage::class)->execute($client, $agreement, 'Halo', []);

    Event::assertDispatched(GigMessageCreated::class, function (GigMessageCreated $event) use ($agreement, $message): bool {
        $payload = $event->broadcastWith();

        return $event->message->is($message)
            && $event->broadcastAs() === 'gig.message.created'
            && $event->broadcastOn()[0]->name === "presence-gig-conversations.{$agreement->id}"
            && $payload['kind'] === GigMessageKind::User->value
            && $payload['message']['id'] === $message->id;
    });

    $system = app(GigConversationService::class)->record(
        $agreement,
        GigWorkflowEvent::WorkStarted,
        "gig:{$gig->id}:started",
    );

    Event::assertDispatched(GigMessageCreated::class, function (GigMessageCreated $event) use ($system): bool {
        return $event->message->is($system)
            && $event->broadcastWith() === [
                'kind' => GigMessageKind::System->value,
                'message_id' => $system->id,
            ];
    });
});

test('only conversation participants satisfy presence channel authorization', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt();
    $unrelated = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $authorize = Broadcast::getChannels()->get('gig-conversations.{agreementId}');

    expect($authorize($client, $agreement->id))->toMatchArray([
        'id' => $client->id,
        'name' => $client->name,
    ])
        ->and($authorize($freelancer, $agreement->id))->toMatchArray([
            'id' => $freelancer->id,
            'name' => $freelancer->name,
        ])
        ->and($authorize($unrelated, $agreement->id))->toBeFalse();
});

test('conversation routes enforce participants mark only incoming messages and expose page props', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt();
    $incoming = GigMessage::factory()
        ->for($agreement, 'agreement')
        ->for($freelancer, 'sender')
        ->for($client, 'recipient')
        ->create(['read_at' => null]);
    $outgoing = GigMessage::factory()
        ->for($agreement, 'agreement')
        ->for($client, 'sender')
        ->for($freelancer, 'recipient')
        ->create(['read_at' => null]);
    Event::fake([GigMessagesRead::class]);

    $this->actingAs($client)
        ->get(route('app.gigs.agreement.show', $gig))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/gigs/agreement')
            ->where('conversation.agreement_id', $agreement->id)
            ->where('conversation.capabilities.canSendMessage', true)
            ->has('conversation.messages'));

    $this->actingAs($client)
        ->post(route('app.gig_conversations.messages.read', $agreement))
        ->assertRedirect();

    expect($incoming->fresh()->read_at)->not->toBeNull()
        ->and($outgoing->fresh()->read_at)->toBeNull();
    Event::assertDispatched(GigMessagesRead::class, fn (GigMessagesRead $event): bool => $event->agreement->is($agreement) && $event->readerId === $client->id,
    );

    $this->actingAs($client)
        ->get(route('app.gig_conversations.show', $agreement))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/gigs/conversation')
            ->where('conversation.agreement_id', $agreement->id)
            ->where('conversation.capabilities.canSendMessage', true)
            ->has('conversation.messages'));

    $this->actingAs($client)
        ->get(route('app.gig_conversations.destination', $agreement))
        ->assertRedirect(route('app.gigs.agreement.show', $gig));

    $this->actingAs($client)
        ->get(route('app.gig_conversations.destination', [
            'agreement' => $agreement,
            'chat_focus' => $incoming->id,
        ]))
        ->assertRedirect(route('app.gigs.agreement.show', [
            'gig' => $gig,
            'chat_focus' => $incoming->id,
        ]));

    $unrelated = User::factory()->client()->create(['onboarding_step' => null]);
    $this->actingAs($unrelated)
        ->get(route('app.gig_conversations.show', $agreement))
        ->assertNotFound();
});

test('banned participants may read terminal conversation and media but cannot read active chat', function () {
    [$client, $freelancer, $gig, $offer, $agreement] = conversationAttempt(GigStatus::Completed);
    $message = GigMessage::factory()
        ->for($agreement, 'agreement')
        ->for($client, 'sender')
        ->for($freelancer, 'recipient')
        ->create();
    $media = $message->media()->create([
        'path' => 'gig-messages/history.jpg',
        'mime_type' => 'image/jpeg',
        'display_order' => 0,
    ]);
    Storage::disk('cos-private')->put($media->path, 'image');
    UserBan::query()->create([
        'user_id' => $freelancer->id,
        'reason' => 'Test suspension',
        'banned_at' => now(),
        'banned_until' => now()->addDay(),
        'unbanned_at' => null,
    ]);

    $this->actingAs($freelancer->fresh())
        ->get(route('app.history.show', $gig))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('conversation.capabilities.isReadOnly', true)
            ->where('conversation.capabilities.canSendMessage', false));
    $this->actingAs($freelancer->fresh())
        ->get(route('app.gig_message_media.show', $media))
        ->assertOk();
    $this->actingAs($freelancer->fresh())
        ->get(route('app.gig_conversations.show', $agreement))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/gigs/conversation')
            ->where('conversation.capabilities.isReadOnly', true)
            ->where('conversation.capabilities.canSendMessage', false));

    $gig->forceFill(['status' => GigStatus::InProgress, 'completed_at' => null])->save();
    $this->actingAs($freelancer->fresh())
        ->get(route('app.gig_conversations.show', $agreement))
        ->assertRedirect(route('app.suspension'));
});
