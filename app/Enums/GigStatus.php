<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum GigStatus: string
{
    use HasValues;

    case Open = 'open';
    case AgreementPreparation = 'agreement_preparation';
    case LockPending = 'lock_pending';
    case PaymentPending = 'payment_pending';
    case Locked = 'locked';
    case InProgress = 'in_progress';
    case Review = 'review';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Disputed = 'disputed';

    public static function defaultValue(): string
    {
        return self::Open->value;
    }
}
