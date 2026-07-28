<?php

namespace App\Enums;

enum GigRealtimeChange: string
{
    case Gig = 'gig';
    case Offer = 'offer';
    case Agreement = 'agreement';
    case Payment = 'payment';
    case Workflow = 'workflow';
    case Dispute = 'dispute';
    case Rating = 'rating';
}
