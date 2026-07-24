<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum GigOfferStatus: string
{
    use HasValues;

    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case WITHDRAWN = 'withdrawn';
    case AUTO_WITHDRAWN = 'auto_withdrawn';

    public static function defaultValue(): string
    {
        return self::PENDING->value;
    }
}
