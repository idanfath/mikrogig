<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum UserRole: string
{
    use HasValues;

    case Freelancer = 'freelancer';
    case Client = 'client';
    case Admin = 'admin';

    public static function defaultValue(): string
    {
        return self::Freelancer->value;
    }

    public static function selectable(): array
    {
        return [
            self::Freelancer,
            self::Client,
        ];
    }
}
