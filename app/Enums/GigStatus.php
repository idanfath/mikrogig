<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum GigStatus: string
{
    use HasValues;

    case Open = 'open';

    public static function defaultValue(): string
    {
        return self::Open->value;
    }
}
