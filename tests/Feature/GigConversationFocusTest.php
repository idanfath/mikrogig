<?php

use App\Models\GigAgreement;
use App\Models\GigMessage;
use App\Services\GigConversationService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\Request;

uses(LazilyRefreshDatabase::class);

function focusRequest(GigAgreement $agreement, ?int $messageId): Request
{
    $request = Request::create('/', 'GET', $messageId === null ? [] : ['chat_focus' => $messageId]);
    $request->setUserResolver(fn () => $agreement->gig->client);

    return $request;
}

test('focused conversation returns a truthful middle window', function () {
    $agreement = GigAgreement::factory()->create();
    $messages = GigMessage::factory()
        ->count(60)
        ->for($agreement, 'agreement')
        ->create();
    $target = $messages[30];

    $conversation = app(GigConversationService::class)->present(
        focusRequest($agreement, $target->id),
        $agreement,
    );

    expect($conversation)
        ->mode->toBe('focused')
        ->focused_message_id->toBe($target->id)
        ->has_older->toBeTrue()
        ->has_newer->toBeTrue()
        ->and($conversation['messages'])->toHaveCount(50)
        ->and(collect($conversation['messages'])->pluck('id'))->toContain($target->id);
});

test('focused conversation flags exact boundaries as exhausted', function () {
    $agreement = GigAgreement::factory()->create();
    GigMessage::factory()
        ->count(50 - $agreement->messages()->count())
        ->for($agreement, 'agreement')
        ->create();
    $messages = $agreement->messages()->get();
    $target = $messages[25];

    $conversation = app(GigConversationService::class)->present(
        focusRequest($agreement, $target->id),
        $agreement,
    );

    expect($conversation['has_older'])->toBeFalse()
        ->and($conversation['has_newer'])->toBeFalse()
        ->and($conversation['messages'])->toHaveCount(50);
});

test('latest conversation always returns the normalized window fields', function () {
    $agreement = GigAgreement::factory()->create();
    GigMessage::factory()
        ->count(3)
        ->for($agreement, 'agreement')
        ->create();

    $conversation = app(GigConversationService::class)->present(
        focusRequest($agreement, null),
        $agreement,
    );

    expect($conversation)
        ->mode->toBe('latest')
        ->focused_message_id->toBeNull()
        ->has_newer->toBeFalse()
        ->newest_id->not->toBeNull();
});

test('focused conversation rejects a message from another agreement', function () {
    $agreement = GigAgreement::factory()->create();
    $otherAgreement = GigAgreement::factory()->create();
    $otherMessage = GigMessage::factory()
        ->for($otherAgreement, 'agreement')
        ->create();

    expect(fn () => app(GigConversationService::class)->present(
        focusRequest($agreement, $otherMessage->id),
        $agreement,
    ))->toThrow(ModelNotFoundException::class);
});
