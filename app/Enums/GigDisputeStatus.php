<?php

namespace App\Enums;

enum GigDisputeStatus: string
{
    case AwaitingCounterproof = 'awaiting_counterproof';
    case AwaitingAdmin = 'awaiting_admin';
    case Resolved = 'resolved';
}
