<?php

namespace App\Enums;

enum GigExitStatus: string
{
    case Pending = 'pending';
    case Refused = 'refused';
    case Withdrawn = 'withdrawn';
    case Executed = 'executed';
}
