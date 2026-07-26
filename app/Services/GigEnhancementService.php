<?php

namespace App\Services;

use RuntimeException;

class GigEnhancementService
{
    public function __construct(
        protected AiService $aiService
    ) {}

    public function enhance(string $field, ?string $value, array $context = []): string
    {
        [$systemPrompt, $userMessage] = $this->buildPrompt($field, $value, $context);
        $raw = $this->aiService->chat($systemPrompt, $userMessage);
        $clean = $this->stripModelNoise($raw);

        return $this->parseStringField($field, $clean, $value ?? '');
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function buildPrompt(string $field, ?string $value, array $context): array
    {
        $contextInfo = '';
        if (! empty($context['category'])) {
            $contextInfo .= "\nKategori Gig: ".$context['category'];
        }
        if (! empty($context['description']) && $field === 'title') {
            $contextInfo .= "\nDeskripsi Gig: ".$context['description'];
        }
        if (! empty($context['title']) && $field === 'description') {
            $contextInfo .= "\nJudul Gig: ".$context['title'];
        }

        if ($field === 'title') {
            $userMessage = 'Original Gig Title: '.$value;
            if ($contextInfo) {
                $userMessage .= "\n\nAdditional Context:".$contextInfo;
            }

            return [config('ai.prompts.enhance_gig_title'), $userMessage];
        }

        if ($field === 'description') {
            $userMessage = 'Original Gig Description: '.$value;
            if ($contextInfo) {
                $userMessage .= "\n\nAdditional Context:".$contextInfo;
            }

            return [config('ai.prompts.enhance_gig_description'), $userMessage];
        }

        throw new RuntimeException("Unsupported gig enhancement field: {$field}");
    }

    private function parseStringField(string $field, string $text, string $fallback): string
    {
        $decoded = json_decode($text, true);
        if (is_array($decoded) && isset($decoded[$field]) && is_string($decoded[$field])) {
            $val = trim($decoded[$field]);

            return $val !== '' ? $val : $fallback;
        }

        return $text !== '' ? $text : $fallback;
    }

    private function stripModelNoise(string $raw): string
    {
        $text = trim($raw);

        if (preg_match('/^```(?:json)?\s*(.*?)\s*```$/s', $text, $matches)) {
            $text = trim($matches[1]);
        }

        return $text;
    }
}
