<?php

namespace App\Enums;

enum GigSettlementOutcome: string
{
    case FullClientRefund = 'full_client_refund';
    case ThirtySeventy = 'thirty_seventy';
    case FullFreelancerPayout = 'full_freelancer_payout';
}
