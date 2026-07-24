<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

class MailService
{
    public static function send($to, $subject, $data = [])
    {
        $html = view('emails.layout', $data)->render();

        if (! config('services.resend.allow_send')) {
            return true;
        }

        // for debugging purposes uncomment this: (save the rendered HTML to a file and open it in the browser)
        // file_put_contents(storage_path('logs/mail_debug_' . time() . '.html'), $html);
        // if (app()->environment('local')) {
        //   $url = 'file://' . storage_path('logs/mail_debug_' . time() . '.html');
        //   shell_exec("xdg-open {$url}");
        // }

        return self::send_mail($to, $subject, $html);
    }

    public static function buildEmailData($subject, $body, $additionalBlocks = [], ?string $actionUrl = null, ?string $actionLabel = null, ?bool $automated = true): array
    {
        $data = [
            'blocks' => [
                ['type' => 'heading', 'content' => $subject],
                ['type' => 'text', 'content' => $body],
            ],
            'automated' => $automated,
        ];

        if (! empty($additionalBlocks)) {
            $data['blocks'] = array_merge($data['blocks'], $additionalBlocks);
        }

        if ($actionUrl && $actionLabel) {
            $data['blocks'][] = ['type' => 'spacer', 'height' => '20px'];
            $data['blocks'][] = ['type' => 'button', 'label' => $actionLabel, 'url' => $actionUrl, 'attributes' => ['target' => '_blank']];
        }

        return $data;
    }

    private static function send_mail($to, $subject, $html)
    {
        $response = Http::withToken(config('services.resend.key'))
            ->connectTimeout(config('services.resend.connect_timeout'))
            ->timeout(config('services.resend.timeout'))
            ->retry([200, 500, 1000], 0, function (Throwable $exception, PendingRequest $request): bool {
                return $exception instanceof ConnectionException ||
                    ($exception instanceof RequestException &&
                        ($exception->response->status() === 429 || $exception->response->serverError()));
            }, throw: false)
            ->post('https://api.resend.com/emails', [
                'from' => config('app.name').' <no-reply@'.config('services.resend.domain').'>',
                'to' => is_array($to) ? $to : [$to],
                'subject' => $subject,
                'html' => $html,
            ]);

        return $response->throw();
    }
}
