<?php

namespace App\Enums;

enum GigDiscoveryChange: string
{
    case Upsert = 'upsert';
    case Remove = 'remove';
    case ApplicantCount = 'applicant_count';
}
