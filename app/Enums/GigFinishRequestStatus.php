<?php

namespace App\Enums;

enum GigFinishRequestStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case AutoAccepted = 'auto_accepted';
}
