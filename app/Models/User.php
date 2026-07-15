<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Jobs\SendMailJob;
use App\Services\CompressionService;
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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

#[Guarded(['id'])]
#[Appends(['avatar_url', 'is_banned'])]
#[Hidden(['password', 'remember_token', 'avatar'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, MustVerifyEmailTrait, Notifiable;

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
            get: fn () => Storage::url($this->avatar ?? 'avatars/default_avatar.jpg')
        );
    }

    public function updateAvatar(UploadedFile $file): string
    {
        if ($this->avatar && $this->avatar !== 'avatars/default_avatar.jpg') {
            Storage::disk('cos')->delete($this->avatar);
        }

        $content = file_get_contents($file->getRealPath());

        if ($file->getSize() > 2.5 * 1024 * 1024) {
            $content = app(CompressionService::class)->compress(
                $content, 'jpg', ['quality' => 80, 'maxWidth' => 512]
            );
        }

        $path = 'avatars/'.uniqid().'.jpg';
        Storage::disk('cos')->put($path, $content, 'public');

        $this->avatar = $path;
        $this->save();

        return $path;
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
            ]
        );

        $emailData = MailService::buildEmailData(
            subject: 'Reset Your Password',
            body: 'Click the button below to reset your password. If you did not request a password reset, no further action is required.',
            actionUrl: $resetUrl,
            actionLabel: 'Reset Password'
        );

        SendMailJob::dispatch(
            to: $this->email,
            subject: 'Reset Your Password',
            data: $emailData
        );
    }
}
