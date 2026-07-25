<?php

namespace App\Enums;

enum GigAgreementClosureReason: string
{
    case FreelancerDeclined = 'freelancer_declined';
    case FreelancerLeft = 'freelancer_left';
    case ClientRejected = 'client_rejected';
    case GigCancelled = 'gig_cancelled';
}
