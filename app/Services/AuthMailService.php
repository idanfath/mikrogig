<?php

namespace App\Services;

use App\Jobs\SendMailJob;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\URL;

final class AuthMailService
{
  public function sendVerification(User $user): void
  {
    $verificationUrl = URL::temporarySignedRoute(
      'verification.verify',
      Carbon::now()->addMinutes(60),
      ['user' => $user->getKey()]
    );

    $emailData = MailService::buildEmailData(
      subject: 'Verifikasi Alamat Email Kamu',
      body: 'Klik tombol di bawah ini untuk memverifikasi alamat email kamu. Link ini akan kedaluwarsa dalam 60 menit. Jika kamu tidak membuat akun, abaikan email ini.',
      actionUrl: $verificationUrl,
      actionLabel: 'Verifikasi Email'
    );

    SendMailJob::dispatch(
      to: $user->email,
      subject: 'Verifikasi Alamat Email Kamu',
      data: $emailData
    );
  }

  public function sendPasswordReset(User $user): void
  {
    $resetUrl = URL::temporarySignedRoute(
      'password.reset',
      Carbon::now()->addMinutes(60),
      [
        'user' => $user->getKey(),
        'email' => $user->email,
      ]
    );

    $emailData = MailService::buildEmailData(
      subject: 'Atur Ulang Password Kamu',
      body: 'Klik tombol di bawah ini untuk mengatur ulang password kamu. Link ini akan kedaluwarsa dalam 60 menit. Jika kamu tidak meminta pengaturan ulang password, abaikan email ini.',
      actionUrl: $resetUrl,
      actionLabel: 'Atur Ulang Password'
    );

    SendMailJob::dispatch(
      to: $user->email,
      subject: 'Atur Ulang Password Kamu',
      data: $emailData
    );
  }
}
