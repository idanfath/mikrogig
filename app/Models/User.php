<?php

namespace App\Models;

use App\Enums\OnboardingStep;
use App\Enums\UserRole;
use App\Services\AuthMailService;
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
            'onboarding_step' => OnboardingStep::class,
        ];
    }

    /**
     * Get the avatar URL attribute.
     *
     * avatar_url is for direct access, avatar is for storage path,
     * avatar is not hidden since avatar_url might contain default avatar so we always have avatar to show in the app
     */
    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn() => Storage::disk('cos')->url($this->avatar ?? 'avatars/default_avatar.jpg')
        );
    }

    protected $withExists = ['activeBan'];

    protected function IsBanned(): Attribute
    {
        return Attribute::make(
            get: fn() => (bool) ($this->active_ban_exists ?? $this->activeBan()->exists())
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
        return Attribute::get(fn() => $this->regency_name && $this->province_name
            ? "{$this->regency_name}, {$this->province_name}"
            : null);
    }

    public function activeBan()
    {
        // find the most recent active ban for this user :o
        return $this
            ->hasOne(UserBan::class)
            ->active()
            ->latestOfMany();
    }

    public function sendEmailVerificationNotification(): void
    {
        app(AuthMailService::class)->sendVerification($this);
    }

    public function sendPasswordResetNotification($token): void
    {
        app(AuthMailService::class)->sendPasswordReset($this, $token);
    }
}
