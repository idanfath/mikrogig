<?php

use App\Enums\GigDisputeStatus;
use App\Http\Resources\GigDisputeAiOverviewResource;
use App\Models\GigDispute;
use App\Models\GigDisputeAiOverview;
use App\Models\GigMessage;
use App\Models\GigPayment;
use App\Services\GigDisputeAiOverviewEvidenceService;
use App\Services\GigDisputeAiOverviewSnapshotBuilder;
use App\Services\ImageCompressionService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

test('snapshot catalogs every message and excludes images the ai did not process', function () {
    Storage::fake('local');
    Storage::fake('cos');
    mock(ImageCompressionService::class)
        ->shouldReceive('compress')
        ->once()
        ->andReturn('normalized-image');

    $payment = GigPayment::factory()->paid()->create();
    $agreement = $payment->agreement;
    $dispute = GigDispute::factory()->create([
        'gig_id' => $payment->gig_id,
        'gig_agreement_id' => $agreement->id,
        'gig_payment_id' => $payment->id,
        'reporter_id' => $payment->gig->client_id,
        'respondent_id' => $agreement->acceptedOffer->freelancer_id,
        'status' => GigDisputeStatus::AwaitingAdmin,
    ]);
    $textMessage = GigMessage::factory()
        ->for($agreement, 'agreement')
        ->create(['body' => 'Pesan tanpa gambar']);
    $imageMessage = GigMessage::factory()
        ->for($agreement, 'agreement')
        ->create(['body' => 'Pesan dengan gambar']);
    $imageMessage->media()->createMany([
        ['path' => 'gig-messages/readable.jpg', 'mime_type' => 'image/jpeg', 'display_order' => 0],
        ['path' => 'gig-messages/missing.jpg', 'mime_type' => 'image/jpeg', 'display_order' => 1],
    ]);
    Storage::disk('local')->put('gig-messages/readable.jpg', 'image-bytes');

    $built = app(GigDisputeAiOverviewSnapshotBuilder::class)->build($dispute);
    $catalog = $built['evidence_catalog'];
    $messageTargets = collect($catalog)->where('type', 'message')->keyBy('message_id');
    $imageTargets = collect($catalog)->where('type', 'image');

    expect($catalog)->not->toBeList()
        ->and($messageTargets->get($textMessage->id)['message_id'])->toBe($textMessage->id)
        ->and($messageTargets->get($imageMessage->id)['message_id'])->toBe($imageMessage->id)
        ->and($imageTargets)->toHaveCount(1)
        ->and($built['allowed_references'])->toBe(array_keys($catalog))
        ->and(collect($built['coverage']['image_omissions'])->pluck('reason'))->toContain('unreadable')
        ->and(collect($built['snapshot']['chat']['selected_messages'])->flatMap->attachments)->toHaveCount(1);
});

test('evidence presentation exposes typed targets without internal locators', function () {
    $payment = GigPayment::factory()->paid()->create();
    $agreement = $payment->agreement;
    $dispute = GigDispute::factory()->create([
        'gig_id' => $payment->gig_id,
        'gig_agreement_id' => $agreement->id,
        'gig_payment_id' => $payment->id,
        'reporter_id' => $payment->gig->client_id,
        'respondent_id' => $agreement->acceptedOffer->freelancer_id,
        'status' => GigDisputeStatus::AwaitingAdmin,
    ]);
    $overview = GigDisputeAiOverview::factory()->create([
        'gig_dispute_id' => $dispute->id,
        'processing_at' => now(),
        'snapshot' => [
            'dispute' => ['reference' => 'DIS-01', 'status' => 'awaiting_admin'],
            'submissions' => [['reference' => 'SUB-01', 'statement' => 'Bukti tersimpan']],
        ],
        'evidence_catalog' => [
            'DIS-01' => [
                'type' => 'detail',
                'snapshot_path' => 'dispute',
                'exact' => false,
                'current_anchor' => 'ai-source-DIS-01',
                'label' => 'Detail sengketa',
                'context' => 'Snapshot sengketa',
            ],
            'SUB-01' => [
                'type' => 'detail',
                'snapshot_path' => 'submissions.0',
                'exact' => true,
                'anchor' => 'ai-source-SUB-01',
                'label' => 'Pernyataan sengketa',
                'context' => 'Bukti tersimpan',
            ],
            'MSG-000001' => [
                'type' => 'message',
                'message_id' => 42,
                'snapshot_path' => 'chat.selected_messages.0',
                'label' => 'Pesan #1',
                'context' => 'Percakapan gig',
            ],
            'IMG-M-MSG-000001-01' => [
                'type' => 'image',
                'source' => 'chat',
                'media_id' => 99,
                'context_reference' => 'MSG-000001',
                'path' => 'private/path.jpg',
                'label' => 'Lampiran pesan',
                'context' => 'Percakapan gig',
            ],
        ],
    ]);

    $targets = app(GigDisputeAiOverviewEvidenceService::class)->present($overview);
    $resource = (new GigDisputeAiOverviewResource($overview, $targets))->resolve(Request::create('/'));

    expect($targets['DIS-01'])
        ->kind->toBe('snapshot')
        ->current_anchor->toBe('ai-source-DIS-01')
        ->and($targets['SUB-01'])
        ->kind->toBe('page_source')
        ->anchor->toBe('ai-source-SUB-01')
        ->and($targets['MSG-000001'])
        ->kind->toBe('chat_message')
        ->message_id->toBe(42)
        ->and($targets['IMG-M-MSG-000001-01'])
        ->kind->toBe('image')
        ->source_reference->toBe('MSG-000001')
        ->and(json_encode($targets, JSON_THROW_ON_ERROR))
        ->not->toContain('snapshot_path')
        ->not->toContain('private/path.jpg')
        ->and($resource['evidence_targets'])->toBe($targets)
        ->and($resource)->not->toHaveKeys(['snapshot', 'evidence_catalog']);
});
