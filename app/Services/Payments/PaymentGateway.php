<?php

namespace App\Services\Payments;

use App\Models\GigPayment;

interface PaymentGateway
{
    public function createCheckout(GigPayment $payment): PaymentCheckout;

    public function cancelCheckout(GigPayment $payment): void;
}
