<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiService
{
    public function chat(string $systemPrompt, string $userMessage, array $options = []): string
    {
        $payload = [
            'model' => config('ai.model'),
            'stream' => false,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userMessage],
            ],
        ];

        if (! empty($options['json_mode'])) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $response = Http::withToken(config('ai.api_key'))
            ->timeout(30)
            ->withHeader('X-9Router-Token-Saver', 'off')
            ->asJson()
            ->post(config('ai.base_url').'/chat/completions', $payload);

        $response->throw();

        return $response->json('choices.0.message.content');
    }
}
