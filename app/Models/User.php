<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Jobs\SendMailJob;
use App\Services\ImageCompressionService;
use App\Services\MailService;
use Carbon\Carbon;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

#[Guarded(['id'])]
#[Appends(['avatar_url', 'is_banned'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
  /** @use HasFactory<UserFactory> */
  use HasFactory;
  use MustVerifyEmailTrait;
  use Notifiable;

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
  protected function casts(): array
  {
    return [
      'email_verified_at' => 'datetime',
      'password' => 'hashed',
      'date_of_birth' => 'date',
      'role' => UserRole::class,
    ];
  }

  /**
   * Get the avatar URL attribute.
   *
   * avatar_url is for direct access, avatar is for storage path,
   * avatar is not hidden since avatar_url might contain default avatar so we always have avatar to show in the app
   */
  protected function AvatarUrl(): Attribute
  {
    return Attribute::make(
      get: fn () => Storage::disk('cos')->url($this->avatar ?? 'avatars/default_avatar.jpg')
    );
  }

  public function clearAvatar(): void
  {
    if ($this->avatar === null) {
      return;
    }

    $avatar = $this->avatar;

    $this->avatar = null;
    $this->save();

    $this->deleteAvatarAfterCommit($avatar);
  }

  public function updateAvatar(UploadedFile $file): string
  {
    $content = file_get_contents($file->getRealPath());

    if ($content === false || $content === '') {
      throw new \RuntimeException('Failed to read uploaded avatar.');
    }

    return $this->storeAvatarBytes($content);
  }

  public function updateAvatarFromUrl(string $url): ?string
  {
    try {
      $response = Http::timeout(5)
        ->connectTimeout(3)
        ->withHeaders(['Accept' => 'image/*'])
        ->get($url);

      if (!$response->successful()) {
        return null;
      }

      $content = $response->body();
      $maxBytes = 5 * 1024 * 1024;

      if ($content === '' || strlen($content) > $maxBytes) {
        return null;
      }

      $contentType = strtolower((string) $response->header('Content-Type'));

      if ($contentType !== '' && !str_starts_with($contentType, 'image/')) {
        return null;
      }

      return $this->storeAvatarBytes($content);
    } catch (\Throwable $e) {
      Log::warning('Avatar pull from URL failed', [
        'user_id' => $this->id,
        'message' => $e->getMessage(),
      ]);

      return null;
    }
  }

  private function storeAvatarBytes(string $content): string
  {
    if (strlen($content) > 2.5 * 1024 * 1024) {
      $content = app(ImageCompressionService::class)->compress(
        $content,
        'jpg',
        ['quality' => 80, 'maxWidth' => 512, 'maxHeight' => 512, 'crop' => true]
      );
    }

    $path = 'avatars/' . uniqid() . '.jpg';
    Storage::disk('cos')->put($path, $content, 'public');

    $oldAvatar = $this->avatar;

    try {
      $this->avatar = $path;
      $this->save();
    } catch (\Throwable $exception) {
      Storage::disk('cos')->delete($path);

      throw $exception;
    }

    if ($oldAvatar !== null) {
      $this->deleteAvatarAfterCommit($oldAvatar);
    }

    return $path;
  }

  private function deleteAvatarAfterCommit(string $avatar): void
  {
    if (DB::transactionLevel() > 0) {
      DB::afterCommit(fn () => Storage::disk('cos')->delete($avatar));

      return;
    }

    Storage::disk('cos')->delete($avatar);
  }

  protected $withExists = ['activeBan'];

  protected function IsBanned(): Attribute
  {
    return Attribute::make(
      get: fn () => (bool) ($this->active_ban_exists ?? $this->activeBan()->exists())
    );
  }

  public function bans()
  {
    return $this->hasMany(UserBan::class);
  }

  public function notifications()
  {
    return $this->hasMany(Notification::class);
  }

  public function notificationRecipients()
  {
    return $this->hasMany(NotificationRecipient::class);
  }

  public function freelancerProfile()
  {
    return $this->hasOne(FreelancerProfile::class);
  }

  protected function location(): Attribute
  {
    return Attribute::get(fn () => $this->regency_name && $this->province_name
      ? "{$this->regency_name}, {$this->province_name}"
      : null);
  }

  public function activeBan()
  {
    // find the most recent active ban for this user :o
    return $this
      ->hasOne(UserBan::class)
      // row where not unbanned
      ->whereNull('unbanned_at')
      // and either banned_until is null or in the future
      ->where(function ($q) {
        $q
          ->whereNull('banned_until')
          ->orWhere('banned_until', '>', now());
      })
      ->latestOfMany();
  }

  public function sendEmailVerificationNotification(): void
  {
    $verificationUrl = URL::temporarySignedRoute(
      'verification.verify',
      Carbon::now()->addMinutes(60),
      [
        'user' => $this->getKey(),
      ]
    );

    $emailData = MailService::buildEmailData(
      subject: 'Verifikasi Alamat Email Kamu',
      body: 'Klik tombol di bawah ini untuk memverifikasi alamat email kamu. Link ini akan kedaluwarsa dalam 60 menit. Jika kamu tidak membuat akun, abaikan email ini.',
      actionUrl: $verificationUrl,
      actionLabel: 'Verifikasi Email'
    );

    SendMailJob::dispatch(
      to: $this->email,
      subject: 'Verifikasi Alamat Email Kamu',
      data: $emailData
    );
  }

  // function sendPasswordResetNotification() expect a $token param
  // but im using signed route instead so overriding it wont work,
  // need to change name to avoid collision
  public function sendResetPasswordNotification(): void
  {
    $resetUrl = URL::temporarySignedRoute(
      'password.reset',
      Carbon::now()->addMinutes(60),
      [
        'user' => $this->getKey(),
        'email' => $this->email,
      ]
    );

    $emailData = MailService::buildEmailData(
      subject: 'Atur Ulang Password Kamu',
      body: 'Klik tombol di bawah ini untuk mengatur ulang password kamu. Link ini akan kedaluwarsa dalam 60 menit. Jika kamu tidak meminta pengaturan ulang password, abaikan email ini.',
      actionUrl: $resetUrl,
      actionLabel: 'Atur Ulang Password'
    );

    SendMailJob::dispatch(
      to: $this->email,
      subject: 'Atur Ulang Password Kamu',
      data: $emailData
    );
  }
}
