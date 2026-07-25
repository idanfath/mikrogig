<?php

namespace App\Http\Resources;

use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigPaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $isClient = $request->user()?->id === $this->gig->client_id;
        $isPending = $this->status === GigPaymentStatus::Pending
            && $this->gig->status === GigStatus::PaymentPending;
        $beforeDeadline = $this->expires_at->isFuture();
        $canAct = $isClient && $isPending && $beforeDeadline;
        $isMock = $this->provider === 'mock' && config('payments.default') === 'mock';

        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'local_reference' => $this->local_reference,
            'provider' => $this->provider,
            'provider_reference' => $this->provider_reference,
            'checkout_url' => $this->checkout_url,
            'status' => $this->status->value,
            'expires_at' => $this->expires_at->toISOString(),
            'checkout_prepared_at' => $this->checkout_prepared_at?->toISOString(),
            'provider_paid_at' => $this->provider_paid_at?->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'expired_at' => $this->expired_at?->toISOString(),
            'capabilities' => [
                'can_open_checkout' => $canAct && $this->checkout_url !== null,
                'can_retry_checkout' => $canAct
                    && $this->checkout_url === null
                    && $this->provider === config('payments.default'),
                'can_complete_mock_payment' => $canAct && $isMock && $this->checkout_url !== null,
                'can_cancel' => $canAct,
            ],
        ];
    }
}
