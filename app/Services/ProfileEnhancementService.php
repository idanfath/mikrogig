<?php

namespace App\Services;

use App\Models\FreelancerProfile;

class ProfileEnhancementService
{
    public function __construct(protected AiService $aiService) {}

    /**
     * Enhance input field using database context and AI.
     */
    public function enhance(string $field, ?string $value, array $context): string|array
    {
        $contextInfo = '';
        if (! empty($context['skills'])) {
            $skillsList = is_array($context['skills']) ? implode(', ', $context['skills']) : $context['skills'];
            $contextInfo .= "\nKeahlian / Skills: ".$skillsList;
        }

        if ($field === 'title') {
            $systemPrompt = config('ai.prompts.enhance_title');
            $userMessage = 'Original Title: '.$value;
            if ($contextInfo) {
                $userMessage .= "\n\nAdditional Context:".$contextInfo;
            }
        } elseif ($field === 'bio') {
            if (! empty($context['title'])) {
                $contextInfo .= "\nJudul Profil: ".$context['title'];
            }
            $systemPrompt = config('ai.prompts.enhance_bio');
            $userMessage = 'Original Bio: '.$value;
            if ($contextInfo) {
                $userMessage .= "\n\nAdditional Context:".$contextInfo;
            }
        } else {
            $systemPrompt = config('ai.prompts.enhance_skills');
            $title = $context['title'] ?? '';
            $userMessage = 'Judul Profil: '.$title."\nBio: ".($context['bio'] ?? '');

            if (! empty($title)) {
                $skillsList = FreelancerProfile::where('title', 'like', "%{$title}%")
                    ->limit(50)
                    ->get()
                    ->pluck('skills')
                    ->flatten()
                    ->filter()
                    ->map(fn ($s) => strtolower(trim($s)))
                    ->countBy()
                    ->sortDesc()
                    ->take(10)
                    ->keys()
                    ->toArray();

                if (! empty($skillsList)) {
                    $userMessage .= "\n\nPilihan Keahlian Populer di Database: ".implode(', ', $skillsList).
                                    "\n(STRICT: Prioritaskan memilih dari pilihan di atas jika sesuai, atau buat baru jika tidak ada yang cocok)";
                }
            }
        }

        $enhancedValue = $this->aiService->chat($systemPrompt, $userMessage);

        $cleanValue = trim($enhancedValue);
        $cleanValue = preg_replace('/<think>.*?<\/think>/is', '', $cleanValue);
        $cleanValue = trim($cleanValue);

        // Check if response is JSON
        $isJson = false;
        $parsedJson = null;
        if (str_starts_with($cleanValue, '{') || str_starts_with($cleanValue, '[')) {
            $raw = $cleanValue;
            if (str_starts_with($raw, '```')) {
                $raw = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $raw);
            }
            $decoded = json_decode(trim($raw), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $isJson = true;
                $parsedJson = $decoded;
            }
        }

        if ($field === 'skills') {
            $parsedValue = [];
            if ($isJson) {
                $parsedValue = $parsedJson;
                if (is_array($parsedValue) && count($parsedValue) > 0 && ! array_is_list($parsedValue)) {
                    $firstVal = reset($parsedValue);
                    if (is_array($firstVal)) {
                        $parsedValue = $firstVal;
                    }
                }
            } else {
                $cleaned = preg_replace('/[\[\]"\'`]/', '', $cleanValue);
                $parsedValue = array_map('trim', explode(',', $cleaned));
            }

            $parsedValue = array_filter(array_map('strtolower', $parsedValue));

            return array_values($parsedValue);
        }

        $resultString = $cleanValue;
        if ($isJson && is_array($parsedJson)) {
            if (isset($parsedJson[$field])) {
                $resultString = $parsedJson[$field];
            } elseif (isset($parsedJson['value'])) {
                $resultString = $parsedJson['value'];
            } else {
                $firstVal = reset($parsedJson);
                if (is_string($firstVal)) {
                    $resultString = $firstVal;
                }
            }
        }

        $resultString = preg_replace('/^["\'`]|["\'`]$/', '', $resultString);

        return trim($resultString);
    }
}
