<?php

namespace App\Enums;

enum GigDisputeType: string
{
    case NoShow = 'no_show';
    case StartBlocked = 'start_blocked';
    case WorkObstruction = 'work_obstruction';
    case FinishRejected = 'finish_rejected';
}
