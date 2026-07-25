<?php

namespace App\Enums;

enum GigExitType: string
{
    case ClientCancellation = 'client_cancellation';
    case FreelancerAbandonment = 'freelancer_abandonment';
}
