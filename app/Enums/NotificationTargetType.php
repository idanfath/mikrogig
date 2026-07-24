<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum NotificationTargetType: string
{
    use HasValues;

    case Everyone = 'everyone';
    case Role = 'role';
    case Users = 'users';
    case User = 'user';

    public static function defaultValue(): string
    {
        return self::Everyone->value;
    }
}
