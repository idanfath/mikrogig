<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

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
            ->connectTimeout(5)
            ->timeout(30)
            ->retry(2, 300, function (Throwable $exception, PendingRequest $request): bool {
                // transient upstream statuses only. never retry a bad key or malformed prompt,
                // and never retry ConnectionException because an exceeded total timeout throws
                // that same class and would triple worst case latency
                return $exception instanceof RequestException
                    && in_array($exception->response->status(), [429, 500, 502, 503, 504], true);
            })
            ->withHeader('X-9Router-Token-Saver', 'off')
            ->asJson()
            ->post(config('ai.base_url').'/chat/completions', $payload);

        $response->throw();

        return $response->json('choices.0.message.content');
    }
}
