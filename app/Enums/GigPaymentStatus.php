<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum GigPaymentStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Paid = 'paid';
    case Cancelled = 'cancelled';
    case Expired = 'expired';

    public static function defaultValue(): string
    {
        return self::Pending->value;
    }
}
