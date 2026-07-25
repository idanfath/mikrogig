<?php

namespace App\Enums;

enum GigDisputeFinding: string
{
    case ClientAtFault = 'client_at_fault';
    case FreelancerAtFault = 'freelancer_at_fault';
    case Inconclusive = 'inconclusive';
}
