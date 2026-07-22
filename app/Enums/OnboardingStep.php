<?php

namespace App\Enums;

enum OnboardingStep: string
{
    case PickRole = 'pick_role';
    case SetupAvatar = 'setup_avatar';
    case Profile = 'profile';

    public function next(): ?self
    {
        return match ($this) {
            self::SetupAvatar => self::Profile,
            self::Profile => null,
            default => $this,
        };
    }

    public function isSkippable(): bool
    {
        return $this === self::SetupAvatar || $this === self::Profile;
    }
}
