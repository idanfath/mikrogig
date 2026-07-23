<?php

namespace App\Jobs;

use App\Services\MailService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendMailJob implements ShouldQueue
{
    use Queueable;

    public $timeout = 20;

    public $tries = 4;

    public $backoff = [10, 60, 300];

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $to,
        public string $subject,
        public array $data
    ) {
        $this->afterCommit();
    }

    /**
     * Execute the job.
     */
    public function handle(MailService $mailService): void
    {
        $mailService::send(
            to: $this->to,
            subject: $this->subject,
            data: $this->data
        );
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Mail delivery failed', [
            'recipient' => $this->to,
            'subject' => $this->subject,
            'exception' => $exception->getMessage(),
        ]);
    }
}
