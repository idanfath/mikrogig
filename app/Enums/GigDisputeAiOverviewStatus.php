<?php

namespace App\Enums;

enum GigDisputeAiOverviewStatus: string
{
    case Queued = 'queued';
    case Processing = 'processing';
    case Completed = 'completed';
    case Failed = 'failed';
}
