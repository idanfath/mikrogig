<?php

namespace App\Enums;

enum GigMessageKind: string
{
    case User = 'user';
    case System = 'system';
}
