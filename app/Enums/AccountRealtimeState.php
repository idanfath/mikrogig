<?php

namespace App\Enums;

enum AccountRealtimeState: string
{
    case Active = 'active';
    case Suspended = 'suspended';
}
