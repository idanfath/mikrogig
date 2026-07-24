<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum GigOfferStatus: string
{
    use HasValues;

    case PENDING = 'pending';  // waiting client to accept or reject
    case ACCEPTED = 'accepted';  // client accepted
    case REJECTED = 'rejected';  // client rejected or other worker selected, or gig closed
    case WITHDRAWN = 'withdrawn';  // offer withdrawn
    case AUTO_WITHDRAWN = 'auto_withdrawn';  // offer auto-withdrawn cz user accepted by other gig

    public static function defaultValue(): string
    {
        return self::PENDING->value;
    }
}
