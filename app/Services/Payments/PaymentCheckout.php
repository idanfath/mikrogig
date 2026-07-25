<?php

namespace App\Services\Payments;

final readonly class PaymentCheckout
{
    public function __construct(
        public string $providerReference,
        public string $checkoutUrl,
    ) {}
}
