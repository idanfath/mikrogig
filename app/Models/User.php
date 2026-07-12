<?php

namespace App\Models;

use App\Jobs\SendMailJob;
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
        ];
    }

    protected function AvatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => Storage::url($this->avatar ?? 'default_avatar.png')
        );
    }

    // known issue: this will cause an N+1 query when fetching multiple users, but it's fine since scope is small.
    protected function IsBanned(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->activeBan()->exists()
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

    public function activeBan()
    {
        // Find the most recent active ban for this user
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
            subject: 'Verify Your Email Address',
            body: 'Click the button below to verify your email address.',
            actionUrl: $verificationUrl,
            actionLabel: 'Verify Email'
        );

        SendMailJob::dispatch(
            to: $this->email,
            subject: 'Verify Your Email Address',
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
