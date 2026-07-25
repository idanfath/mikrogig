<?php

namespace App\Services\Payments;

use App\Models\GigPayment;

final class MockPaymentGateway implements PaymentGateway
{
    public function createCheckout(GigPayment $payment): PaymentCheckout
    {
        return new PaymentCheckout(
            providerReference: 'mock-'.$payment->local_reference,
            checkoutUrl: route('app.gigs.payment.mock.show', ['gig' => $payment->gig_id]),
        );
    }

    public function cancelCheckout(GigPayment $payment): void {}
}
