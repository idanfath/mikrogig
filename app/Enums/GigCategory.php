<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum GigCategory: string
{
    use HasValues;

    case Labor = 'labor';
    case Cleaning = 'cleaning';
    case Moving = 'moving';
    case Construction = 'construction';
    case Security = 'security';
}
