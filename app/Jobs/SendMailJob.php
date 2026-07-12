<?php

namespace App\Jobs;

use App\Services\MailService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendMailJob implements ShouldQueue
{
  use Queueable;

  /**
   * Create a new job instance.
   */
  public function __construct(
    public string $to,
    public string $subject,
    public array $data
  ) {}

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
}
