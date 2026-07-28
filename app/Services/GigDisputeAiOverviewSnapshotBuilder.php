<?php

namespace App\Services;

use App\Enums\GigMessageKind;
use App\Models\GigDispute;
use App\Models\GigMessage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Throwable;

class GigDisputeAiOverviewSnapshotBuilder
{
    public function __construct(private ImageCompressionService $images) {}

    /**
     * @return array{snapshot: array<string, mixed>, evidence_catalog: array<string, array<string, mixed>>, coverage: array<string, mixed>, image_parts: list<array<string, mixed>>, allowed_references: list<string>}
     */
    public function build(GigDispute $dispute): array
    {
        $dispute->loadMissing([
            'gig.media',
            'agreement.acceptedOffer',
            'payment',
            'submissions.media',
            'finishRequest.media',
        ]);

        $agreement = $dispute->agreement;
        $gig = $dispute->gig;
        $reporterId = $dispute->reporter_id;
        $humanMessageIds = $agreement->messages()
            ->where('kind', GigMessageKind::User)
            ->orderBy('id')
            ->pluck('id');
        [$selectedMessageIds, $omittedMiddle] = $this->selectHumanMessageIds($humanMessageIds);
        $messageOrdinals = $humanMessageIds
            ->values()
            ->mapWithKeys(fn (int $id, int $index): array => [$id => $index + 1]);
        $selectedMessages = $agreement->messages()
            ->with('media')
            ->whereIn('id', $selectedMessageIds)
            ->orderBy('id')
            ->get();
        $systemEvents = $agreement->messages()
            ->where('kind', GigMessageKind::System)
            ->orderBy('id')
            ->get();
        $catalog = $this->baseCatalog();
        $imageCandidates = [];

        $submissions = $dispute->submissions->values()->map(function ($submission, int $index) use (&$catalog, &$imageCandidates, $reporterId): array {
            $reference = sprintf('SUB-%02d', $index + 1);
            $party = $submission->submitted_by === $reporterId ? 'reporter' : 'respondent';
            $catalog[$reference] = $this->detailEntry(
                "dispute.submissions.{$index}",
                'Pernyataan sengketa',
                $party === 'reporter' ? 'Pernyataan pelapor' : 'Pernyataan responden',
                exact: true,
                anchor: "ai-source-{$reference}",
            );

            return [
                'reference' => $reference,
                'party' => $party,
                'type' => $submission->type->value,
                'statement' => $submission->statement,
                'submitted_at' => $submission->submitted_at?->toISOString(),
                'media' => $submission->media->values()->map(function ($media, int $mediaIndex) use ($reference, $party, &$imageCandidates): string {
                    $imageReference = sprintf('IMG-D-%s-%02d', $reference, $mediaIndex + 1);
                    $imageCandidates[] = [
                        'reference' => $imageReference,
                        'type' => 'image',
                        'source' => 'dispute',
                        'disk' => 'local',
                        'path' => $media->path,
                        'media_id' => $media->id,
                        'party' => $party,
                        'context_reference' => $reference,
                        'label' => 'Lampiran pernyataan sengketa',
                        'context' => $party === 'reporter' ? 'Bukti pelapor' : 'Bukti responden',
                    ];

                    return $imageReference;
                })->all(),
            ];
        })->all();

        $messageRows = $selectedMessages->values()->map(function (GigMessage $message, int $index) use ($messageOrdinals, $reporterId, &$catalog, &$imageCandidates): array {
            $ordinal = $messageOrdinals->get($message->id);
            $reference = sprintf('MSG-%06d', $ordinal);
            $party = $message->sender_id === $reporterId ? 'reporter' : 'respondent';
            $catalog[$reference] = [
                'type' => 'message',
                'message_id' => $message->id,
                'snapshot_path' => "chat.selected_messages.{$index}",
                'label' => "Pesan percakapan #{$ordinal}",
                'context' => $party === 'reporter' ? 'Pesan pelapor' : 'Pesan responden',
            ];

            return [
                'reference' => $reference,
                'ordinal' => $ordinal,
                'party' => $party,
                'body' => $message->body,
                'sent_at' => $message->created_at?->toISOString(),
                'attachments' => $message->media->values()->map(function ($media, int $mediaIndex) use ($reference, $message, $party, &$imageCandidates): string {
                    $imageReference = sprintf('IMG-M-%s-%02d', $reference, $mediaIndex + 1);
                    $imageCandidates[] = [
                        'reference' => $imageReference,
                        'type' => 'image',
                        'source' => 'chat',
                        'disk' => 'local',
                        'path' => $media->path,
                        'media_id' => $media->id,
                        'party' => $party,
                        'message_id' => $message->id,
                        'context_reference' => $reference,
                        'label' => 'Lampiran pesan percakapan',
                        'context' => $party === 'reporter' ? 'Lampiran pesan pelapor' : 'Lampiran pesan responden',
                    ];

                    return $imageReference;
                })->all(),
            ];
        })->all();

        foreach ($systemEvents as $index => $message) {
            $reference = sprintf('EVT-%06d', $index + 1);
            $catalog[$reference] = $this->detailEntry(
                "workflow_events.{$index}",
                'Peristiwa workflow',
                'Snapshot peristiwa saat dianalisis',
            );
        }

        if ($dispute->finishRequest !== null) {
            $catalog['FIN-01'] = $this->detailEntry(
                'finish_request',
                'Bukti penyelesaian pekerjaan',
                'Bukti penyelesaian yang tersimpan',
                exact: true,
                anchor: 'ai-source-FIN-01',
            );

            foreach ($dispute->finishRequest->media->values() as $index => $media) {
                $imageCandidates[] = [
                    'reference' => sprintf('IMG-F-%02d', $index + 1),
                    'type' => 'image',
                    'source' => 'finish',
                    'disk' => 'local',
                    'path' => $media->path,
                    'media_id' => $media->id,
                    'context_reference' => 'FIN-01',
                    'label' => 'Lampiran penyelesaian pekerjaan',
                    'context' => 'Bukti hasil pekerjaan',
                ];
            }
        }

        foreach ($gig->media->values() as $index => $media) {
            $imageCandidates[] = [
                'reference' => sprintf('IMG-P-%02d', $index + 1),
                'type' => 'image',
                'source' => 'gig',
                'disk' => 'cos',
                'path' => $media->path,
                'media_id' => $media->id,
                'context_reference' => 'GIG-01',
                'label' => 'Foto gig',
                'context' => 'Foto pada gig saat dipublikasikan',
            ];
        }

        $exitRequests = $gig->exitRequests()->orderBy('id')->get()->values()->map(function ($request, int $index) use (&$catalog): array {
            $reference = sprintf('EXIT-%02d', $index + 1);
            $catalog[$reference] = $this->detailEntry(
                "exit_requests.{$index}",
                'Permintaan keluar gig',
                'Snapshot permintaan keluar saat dianalisis',
            );

            return [
                'reference' => $reference,
                'type' => $request->type->value,
                'reason' => $request->reason,
                'status' => $request->status->value,
                'response' => $request->response?->value,
                'execution_mode' => $request->execution_mode?->value,
                'responded_at' => $request->responded_at?->toISOString(),
                'withdrawn_at' => $request->withdrawn_at?->toISOString(),
                'executed_at' => $request->executed_at?->toISOString(),
            ];
        })->all();

        $coverage = [
            'human_message_total' => $humanMessageIds->count(),
            'human_message_selected' => $selectedMessages->count(),
            'human_message_middle_omitted' => $omittedMiddle,
            'system_event_total' => $systemEvents->count(),
            'image_omissions' => [],
        ];
        $normalizedImages = $this->normalizeImages($imageCandidates, $coverage);
        $catalog = array_merge($catalog, $normalizedImages['catalog']);
        $selectedImageReferences = array_fill_keys(array_keys($normalizedImages['catalog']), true);
        $filterImages = fn (array $references): array => array_values(array_filter(
            $references,
            fn (string $reference): bool => isset($selectedImageReferences[$reference]),
        ));

        foreach ($submissions as &$submission) {
            $submission['media'] = $filterImages($submission['media']);
        }
        unset($submission);

        foreach ($messageRows as &$messageRow) {
            $messageRow['attachments'] = $filterImages($messageRow['attachments']);
        }
        unset($messageRow);

        $snapshot = [
            '_version' => 'v2',
            'dispute' => [
                'reference' => 'DIS-01',
                'type' => $dispute->type->value,
                'status' => $dispute->status->value,
                'opened_at' => $dispute->opened_at?->toISOString(),
                'counterproof_due_at' => $dispute->counterproof_due_at?->toISOString(),
                'submissions' => $submissions,
            ],
            'gig' => [
                'reference' => 'GIG-01',
                'title' => $gig->title,
                'description' => $gig->description,
                'category' => $gig->category->value,
                'location_address' => $gig->location_address,
                'work_date' => $gig->work_date?->toDateString(),
                'start_time' => $gig->start_time,
                'posted_fee' => $gig->posted_fee,
                'created_at' => $gig->created_at?->toISOString(),
                'photos' => $filterImages(array_values(array_map(
                    fn (int $index): string => sprintf('IMG-P-%02d', $index + 1),
                    array_keys($gig->media->values()->all()),
                ))),
            ],
            'accepted_offer' => [
                'reference' => 'OFFER-01',
                'offered_fee' => $agreement->acceptedOffer->offered_fee,
                'note' => $agreement->acceptedOffer->note,
            ],
            'agreement' => [
                'reference' => 'AGR-01',
                'accepted_fee' => $agreement->accepted_fee,
                'final_scope' => $agreement->final_scope,
                'work_date' => $agreement->work_date?->toDateString(),
                'start_time' => $agreement->start_time,
                'location_arrangement' => $agreement->location_arrangement,
                'delivery_expectations' => $agreement->delivery_expectations,
                'final_total_price' => $agreement->final_total_price,
                'terms_version' => $agreement->terms_version,
                'submitted_at' => $agreement->submitted_at?->toISOString(),
                'change_requested_at' => $agreement->change_requested_at?->toISOString(),
                'freelancer_confirmed_at' => $agreement->freelancer_confirmed_at?->toISOString(),
                'closed_at' => $agreement->closed_at?->toISOString(),
            ],
            'payment' => [
                'reference' => 'PAY-01',
                'amount' => $dispute->payment->amount,
                'currency' => $dispute->payment->currency,
                'status' => $dispute->payment->status->value,
                'paid_at' => $dispute->payment->paid_at?->toISOString(),
            ],
            'finish_request' => $this->finishRequest($dispute, $filterImages),
            'exit_requests' => $exitRequests,
            'workflow_events' => $systemEvents->map(fn (GigMessage $message, int $index): array => [
                'reference' => sprintf('EVT-%06d', $index + 1),
                'event' => $message->workflow_event?->value,
                'snapshot' => $message->event_snapshot,
                'created_at' => $message->created_at?->toISOString(),
            ])->all(),
            'chat' => [
                'selected_messages' => $messageRows,
                'middle_omitted_count' => $omittedMiddle,
                'instruction' => $omittedMiddle > 0
                    ? 'Middle chat messages were omitted. Do not infer continuity across omitted ordinals.'
                    : null,
            ],
        ];

        return [
            'snapshot' => $snapshot,
            'evidence_catalog' => $catalog,
            'coverage' => $coverage,
            'image_parts' => $normalizedImages['parts'],
            'allowed_references' => array_keys($catalog),
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function baseCatalog(): array
    {
        return [
            'DIS-01' => $this->detailEntry(
                'dispute',
                'Detail sengketa',
                'Snapshot sengketa saat dianalisis',
                currentAnchor: 'ai-source-DIS-01',
            ),
            'GIG-01' => $this->detailEntry('gig', 'Detail gig', 'Snapshot gig saat dianalisis'),
            'OFFER-01' => $this->detailEntry('accepted_offer', 'Penawaran diterima', 'Snapshot penawaran saat dianalisis'),
            'AGR-01' => $this->detailEntry('agreement', 'Persetujuan gig', 'Snapshot persetujuan saat dianalisis'),
            'PAY-01' => $this->detailEntry('payment', 'Pembayaran gig', 'Snapshot pembayaran saat dianalisis'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function detailEntry(
        string $snapshotPath,
        string $label,
        string $context,
        bool $exact = false,
        ?string $anchor = null,
        ?string $currentAnchor = null,
    ): array {
        return array_filter([
            'type' => 'detail',
            'snapshot_path' => $snapshotPath,
            'exact' => $exact,
            'anchor' => $anchor,
            'current_anchor' => $currentAnchor,
            'label' => $label,
            'context' => $context,
        ], fn (mixed $value): bool => $value !== null);
    }

    /** @return array{0: Collection<int, int>, 1: int} */
    private function selectHumanMessageIds(Collection $ids): array
    {
        if ($ids->count() <= 1000) {
            return [$ids->values(), 0];
        }

        $oldest = $ids->take(150);
        $newest = $ids->take(-300);
        $middle = $ids->slice(150, $ids->count() - 450)->values();
        $sampled = collect(range(0, 549))->map(function (int $index) use ($middle): int {
            $position = (int) floor($index * ($middle->count() - 1) / 549);

            return $middle->get($position);
        });

        return [
            $oldest->merge($sampled)->merge($newest)->unique()->sort()->values(),
            $ids->count() - 1000,
        ];
    }

    /**
     * @param  callable(array<string>): array<string>  $filterImages
     * @return array<string, mixed>|null
     */
    private function finishRequest(GigDispute $dispute, callable $filterImages): ?array
    {
        if ($dispute->finishRequest === null) {
            return null;
        }

        return [
            'reference' => 'FIN-01',
            'completion_note' => $dispute->finishRequest->completion_note,
            'rejection_reason' => $dispute->finishRequest->rejection_reason,
            'review_due_at' => $dispute->finishRequest->review_due_at?->toISOString(),
            'accepted_at' => $dispute->finishRequest->accepted_at?->toISOString(),
            'rejected_at' => $dispute->finishRequest->rejected_at?->toISOString(),
            'photos' => $filterImages(array_values(array_map(
                fn (int $index): string => sprintf('IMG-F-%02d', $index + 1),
                array_keys($dispute->finishRequest->media->values()->all()),
            ))),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $candidates
     * @param  array<string, mixed>  $coverage
     * @return array{parts: list<array<string, mixed>>, catalog: array<string, array<string, mixed>>}
     */
    private function normalizeImages(array $candidates, array &$coverage): array
    {
        $orderedCandidates = array_merge(
            $this->alternateParties(array_values(array_filter($candidates, fn (array $entry): bool => $entry['source'] === 'dispute'))),
            array_values(array_filter($candidates, fn (array $entry): bool => $entry['source'] === 'finish')),
            array_values(array_filter($candidates, fn (array $entry): bool => $entry['source'] === 'gig')),
            $this->alternateParties(array_values(array_filter($candidates, fn (array $entry): bool => $entry['source'] === 'chat'))),
        );
        $parts = [];
        $catalog = [];
        $bytes = 0;

        foreach ($orderedCandidates as $entry) {
            if (count($parts) === 30) {
                $coverage['image_omissions'][] = ['reference' => $entry['reference'], 'reason' => 'image_count_limit'];

                continue;
            }

            try {
                $content = Storage::disk($entry['disk'])->get($entry['path']);
                $normalized = $this->images->compress($content, 'webp', ['quality' => 82, 'maxWidth' => 1920, 'maxHeight' => 1920]);
            } catch (Throwable) {
                $coverage['image_omissions'][] = ['reference' => $entry['reference'], 'reason' => 'unreadable'];

                continue;
            }

            if ($bytes + strlen($normalized) > 40 * 1024 * 1024) {
                $coverage['image_omissions'][] = ['reference' => $entry['reference'], 'reason' => 'byte_budget'];

                continue;
            }

            $bytes += strlen($normalized);
            $parts[] = [
                'type' => 'image_url',
                'image_url' => ['url' => 'data:image/webp;base64,'.base64_encode($normalized)],
                'reference' => $entry['reference'],
            ];
            unset($entry['disk'], $entry['party']);

            if ($entry['source'] !== 'gig') {
                unset($entry['path']);
            }

            $catalog[$entry['reference']] = $entry;
        }

        $coverage['image_selected_count'] = count($parts);
        $coverage['image_selected_bytes'] = $bytes;

        return ['parts' => $parts, 'catalog' => $catalog];
    }

    /**
     * @param  list<array<string, mixed>>  $entries
     * @return list<array<string, mixed>>
     */
    private function alternateParties(array $entries): array
    {
        $reporter = array_values(array_filter($entries, fn (array $entry): bool => ($entry['party'] ?? null) === 'reporter'));
        $respondent = array_values(array_filter($entries, fn (array $entry): bool => ($entry['party'] ?? null) === 'respondent'));
        $ordered = [];

        while ($reporter !== [] || $respondent !== []) {
            if ($reporter !== []) {
                $ordered[] = array_shift($reporter);
            }

            if ($respondent !== []) {
                $ordered[] = array_shift($respondent);
            }
        }

        return $ordered;
    }
}
