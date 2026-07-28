<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

class AiService
{
    /**
     * @param  array<string, mixed>  $options
     */
    public function chat(string $systemPrompt, string $userMessage, array $options = []): string
    {
        return $this->chatMessages([
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userMessage],
        ], $options);
    }

    /**
     * @param  list<array{role: string, content: string|list<array<string, mixed>>}>  $messages
     * @param  array{json_mode?: bool, model?: string, temperature?: float, max_tokens?: int, connect_timeout?: int, timeout?: int, retries?: int}  $options
     */
    public function chatMessages(array $messages, array $options = []): string
    {
        $payload = [
            'model' => $options['model'] ?? config('ai.model'),
            'stream' => false,
            'messages' => $messages,
        ];

        if (! empty($options['json_mode'])) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        if (isset($options['temperature'])) {
            $payload['temperature'] = $options['temperature'];
        }

        if (isset($options['max_tokens'])) {
            $payload['max_tokens'] = $options['max_tokens'];
        }

        $request = Http::withToken(config('ai.api_key'))
            ->connectTimeout($options['connect_timeout'] ?? 5)
            ->timeout($options['timeout'] ?? 30)
            ->withHeader('X-9Router-Token-Saver', 'off')
            ->asJson();

        $retries = $options['retries'] ?? 2;

        if ($retries > 0) {
            $request = $request->retry($retries, 300, function (Throwable $exception, PendingRequest $request): bool {
                // transient upstream statuses only. never retry a bad key or malformed prompt,
                // and never retry ConnectionException because an exceeded total timeout throws
                // that same class and would triple worst case latency
                return $exception instanceof RequestException
                    && in_array($exception->response->status(), [429, 500, 502, 503, 504], true);
            });
        }

        $response = $request->post(config('ai.base_url').'/chat/completions', $payload);

        $response->throw();

        return $response->json('choices.0.message.content');
    }
}
