<?php

namespace App\Services;

use JsonException;

class GigDisputeAiOverviewValidator
{
    private const SECTIONS = [
        'neutral_summary',
        'chronology',
        'reporter_position',
        'respondent_position',
        'consistent_facts',
        'contradictions',
        'uncertain_items',
        'admin_review_focus',
    ];

    /**
     * @param  list<string>  $allowedReferences
     * @return array{valid: bool, result: ?array<string, list<array{segments: list<array{type: string, text?: string, reference?: string}>}>>, errors: list<string>}
     */
    public function validate(string $response, array $allowedReferences): array
    {
        try {
            $decoded = json_decode($response, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return ['valid' => false, 'result' => null, 'errors' => ['Response is not valid JSON.']];
        }

        if (! is_array($decoded) || count($decoded) !== count(self::SECTIONS)
            || array_diff(array_keys($decoded), self::SECTIONS) !== []) {
            return ['valid' => false, 'result' => null, 'errors' => ['Response must contain only the eight required sections.']];
        }

        $errors = [];
        $result = [];

        foreach (self::SECTIONS as $section) {
            $items = $decoded[$section] ?? null;

            if (! is_array($items) || $items === [] || ! array_is_list($items)) {
                $errors[] = "{$section} must be a non-empty list.";

                continue;
            }

            $result[$section] = [];

            foreach ($items as $index => $item) {
                if (! is_array($item) || count($item) !== 1 || ! array_key_exists('segments', $item)) {
                    $errors[] = "{$section}.{$index} has an unexpected shape.";

                    continue;
                }

                $segments = $item['segments'];

                if (! is_array($segments) || $segments === [] || ! array_is_list($segments)) {
                    $errors[] = "{$section}.{$index}.segments must be a non-empty list.";

                    continue;
                }

                $normalized = [];
                $hasText = false;

                foreach ($segments as $segmentIndex => $segment) {
                    if (! is_array($segment) || ! isset($segment['type'])) {
                        $errors[] = "{$section}.{$index}.segments.{$segmentIndex} has an unexpected shape.";

                        continue 2;
                    }

                    if ($segment['type'] === 'text') {
                        if (count($segment) !== 2
                            || array_diff(array_keys($segment), ['type', 'text']) !== []
                            || ! is_string($segment['text'])
                            || trim($segment['text']) === ''
                            || $this->containsProhibitedContent($segment['text'])) {
                            $errors[] = "{$section}.{$index}.segments.{$segmentIndex} has invalid text.";

                            continue 2;
                        }

                        $hasText = true;
                        $normalized[] = ['type' => 'text', 'text' => trim($segment['text'])];

                        continue;
                    }

                    if ($segment['type'] === 'evidence_ref') {
                        if (count($segment) !== 2
                            || array_diff(array_keys($segment), ['type', 'reference']) !== []
                            || ! is_string($segment['reference'])
                            || ! in_array($segment['reference'], $allowedReferences, true)
                            || str_contains($segment['reference'], '/')) {
                            $errors[] = "{$section}.{$index}.segments.{$segmentIndex} contains an unknown reference.";

                            continue 2;
                        }

                        $normalized[] = ['type' => 'evidence_ref', 'reference' => $segment['reference']];

                        continue;
                    }

                    $errors[] = "{$section}.{$index}.segments.{$segmentIndex} has an unknown type.";

                    continue 2;
                }

                if (! $hasText) {
                    $errors[] = "{$section}.{$index} must contain a text segment.";

                    continue;
                }

                $result[$section][] = ['segments' => $normalized];
            }
        }

        return [
            'valid' => $errors === [],
            'result' => $errors === [] ? $result : null,
            'errors' => $errors,
        ];
    }

    private function containsProhibitedContent(string $text): bool
    {
        return preg_match('/<[^>]+>|https?:\\/\\/|www\\.|(?:recommend|rekomendasi|putusan)\\s+(?:a|an|the|untuk)|(?:should|harus)\\s+(?:win|lose|pay|membayar|menang|kalah)/iu', $text) === 1;
    }
}
