<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigSettlementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return ['total_amount' => $this->total_amount, 'freelancer_payout' => $this->freelancer_payout, 'client_refund' => $this->client_refund, 'outcome' => $this->outcome->value, 'recorded_at' => $this->recorded_at->toISOString()];
    }
}
