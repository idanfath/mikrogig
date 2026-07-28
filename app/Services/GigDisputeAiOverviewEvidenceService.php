<?php

namespace App\Services;

use App\Models\GigDisputeAiOverview;
use Illuminate\Support\Facades\Storage;

class GigDisputeAiOverviewEvidenceService
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public function present(GigDisputeAiOverview $overview): array
    {
        $catalog = $overview->evidence_catalog ?? [];

        if (! is_array($catalog) || array_is_list($catalog)) {
            return [];
        }

        $targets = [];

        foreach ($catalog as $reference => $entry) {
            if (! is_string($reference) || ! is_array($entry)) {
                continue;
            }

            $target = match ($entry['type'] ?? null) {
                'detail' => $this->presentDetail($overview, $entry),
                'message' => $this->presentMessage($entry),
                'image' => $this->presentImage($entry),
                default => null,
            };

            if ($target !== null) {
                $targets[$reference] = $target;
            }
        }

        return $targets;
    }

    /**
     * @param  array<string, mixed>  $entry
     * @return array<string, mixed>|null
     */
    private function presentDetail(GigDisputeAiOverview $overview, array $entry): ?array
    {
        $label = $entry['label'] ?? null;
        $context = $entry['context'] ?? null;

        if (! is_string($label) || ! is_string($context)) {
            return null;
        }

        if (($entry['exact'] ?? false) === true && isset($entry['anchor']) && is_string($entry['anchor'])) {
            return [
                'kind' => 'page_source',
                'anchor' => $entry['anchor'],
                'label' => $label,
                'context' => $context,
            ];
        }

        $path = $entry['snapshot_path'] ?? null;
        $fields = is_string($path) ? data_get($overview->snapshot ?? [], $path) : null;

        if (! is_array($fields)) {
            return null;
        }

        $target = [
            'kind' => 'snapshot',
            'label' => $label,
            'context' => $context,
            'captured_at' => ($overview->processing_at ?? $overview->created_at)->toISOString(),
            'fields' => $fields,
        ];

        if (isset($entry['current_anchor']) && is_string($entry['current_anchor'])) {
            $target['current_anchor'] = $entry['current_anchor'];
        }

        return $target;
    }

    /**
     * @param  array<string, mixed>  $entry
     * @return array<string, mixed>|null
     */
    private function presentMessage(array $entry): ?array
    {
        if (! isset($entry['message_id']) || ! is_int($entry['message_id'])) {
            return null;
        }

        return [
            'kind' => 'chat_message',
            'message_id' => $entry['message_id'],
            'label' => $entry['label'] ?? 'Pesan percakapan',
            'context' => $entry['context'] ?? 'Percakapan gig',
        ];
    }

    /**
     * @param  array<string, mixed>  $entry
     * @return array<string, mixed>|null
     */
    private function presentImage(array $entry): ?array
    {
        $url = $this->mediaUrl($entry);

        if ($url === null) {
            return null;
        }

        $target = [
            'kind' => 'image',
            'url' => $url,
            'label' => $entry['label'] ?? 'Lampiran gambar',
            'context' => $entry['context'] ?? 'Bukti gambar',
        ];

        if (isset($entry['context_reference']) && is_string($entry['context_reference'])) {
            $target['source_reference'] = $entry['context_reference'];
        }

        return $target;
    }

    /**
     * @param  array<string, mixed>  $entry
     */
    private function mediaUrl(array $entry): ?string
    {
        $mediaId = $entry['media_id'] ?? null;

        if (! is_int($mediaId)) {
            return null;
        }

        return match ($entry['source'] ?? null) {
            'dispute' => route('app.gig_dispute_media.show', $mediaId),
            'finish' => route('app.gig_finish_request_media.show', $mediaId),
            'chat' => route('app.gig_message_media.show', $mediaId),
            'gig' => isset($entry['path']) && is_string($entry['path'])
                ? Storage::disk('cos')->url($entry['path'])
                : null,
            default => null,
        };
    }
}
