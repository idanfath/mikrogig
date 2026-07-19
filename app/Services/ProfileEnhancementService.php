<?php

namespace App\Services;

use App\Models\FreelancerProfile;

class ProfileEnhancementService
{
  public function __construct(
    protected AiService $aiService
  ) {}

  public function enhance(string $field, ?string $value, array $context): string|array
  {
    [$systemPrompt, $userMessage] = $this->buildPrompt($field, $value, $context);
    $raw = $this->aiService->chat($systemPrompt, $userMessage);
    $clean = $this->stripModelNoise($raw);

    if ($field === 'skills') {
      return $this->parseSkills($clean);
    }

    return $this->parseStringField($field, $clean);
  }

  /**
   * @return array{0: string, 1: string}
   */
  private function buildPrompt(string $field, ?string $value, array $context): array
  {
    $contextInfo = '';
    if (!empty($context['skills'])) {
      $skillsList = is_array($context['skills']) ? implode(', ', $context['skills']) : $context['skills'];
      $contextInfo .= "\nKeahlian / Skills: " . $skillsList;
    }

    if ($field === 'title') {
      $userMessage = 'Original Title: ' . $value;
      if ($contextInfo) {
        $userMessage .= "\n\nAdditional Context:" . $contextInfo;
      }

      return [config('ai.prompts.enhance_title'), $userMessage];
    }

    if ($field === 'bio') {
      if (!empty($context['title'])) {
        $contextInfo .= "\nJudul Profil: " . $context['title'];
      }
      $userMessage = 'Original Bio: ' . $value;
      if ($contextInfo) {
        $userMessage .= "\n\nAdditional Context:" . $contextInfo;
      }

      return [config('ai.prompts.enhance_bio'), $userMessage];
    }

    // skills: suggest from title/bio (+ popular DB skills when title present)
    $title = $context['title'] ?? '';
    $userMessage = 'Judul Profil: ' . $title . "\nBio: " . ($context['bio'] ?? '');

    if (!empty($title)) {
      $popularSkills = FreelancerProfile::where('title', 'like', "%{$title}%")
        ->limit(50)
        ->get()
        ->pluck('skills')
        ->flatten()
        ->filter()
        ->map(fn($s) => strtolower(trim($s)))
        ->countBy()
        ->sortDesc()
        ->take(10)
        ->keys()
        ->toArray();

      if (!empty($popularSkills)) {
        $userMessage .= "\n\nPilihan Keahlian Populer di Database: " . implode(', ', $popularSkills)
          . "\n(STRICT: Prioritaskan memilih dari pilihan di atas jika sesuai, atau buat baru jika tidak ada yang cocok)";
      }
    }

    return [config('ai.prompts.enhance_skills'), $userMessage];
  }

  /**
   * strip think blocks and markdown fences so JSON detect can run
   */
  private function stripModelNoise(string $raw): string
  {
    $clean = trim($raw);
    $clean = preg_replace('/#{@.*?<\/think>/is', '', $clean) ?? $clean;
    $clean = trim($clean);
    // fence strip must run before { / [ check cz models often wrap JSON in ```json
    $clean = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $clean) ?? $clean;

    return trim($clean);
  }

  private function tryDecodeJson(string $clean): mixed
  {
    if (!str_starts_with($clean, '{') && !str_starts_with($clean, '[')) {
      return null;
    }

    $decoded = json_decode($clean, true);

    return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
  }

  /**
   * @return list<string>
   */
  private function parseSkills(string $clean): array
  {
    $decoded = $this->tryDecodeJson($clean);

    if (is_array($decoded)) {
      // {"skills": [...]} or similar object wrapper → take first array value
      if (count($decoded) > 0 && !array_is_list($decoded)) {
        $firstVal = reset($decoded);
        if (is_array($firstVal)) {
          $decoded = $firstVal;
        }
      }
      $parsed = $decoded;
    } else {
      $cleaned = preg_replace('/[\[\]"\'`]/', '', $clean) ?? $clean;
      $parsed = array_map('trim', explode(',', $cleaned));
    }

    $parsed = array_filter(array_map('strtolower', $parsed));

    return array_values($parsed);
  }

  private function parseStringField(string $field, string $clean): string
  {
    $decoded = $this->tryDecodeJson($clean);
    $result = $clean;

    if (is_array($decoded)) {
      if (isset($decoded[$field]) && is_string($decoded[$field])) {
        $result = $decoded[$field];
      } elseif (isset($decoded['value']) && is_string($decoded['value'])) {
        $result = $decoded['value'];
      } else {
        $firstVal = reset($decoded);
        if (is_string($firstVal)) {
          $result = $firstVal;
        }
      }
    }

    $result = preg_replace('/^["\'`]|["\'`]$/', '', $result) ?? $result;

    return trim($result);
  }
}
