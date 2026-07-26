<?php

namespace App\Http\Resources;

use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigOfferResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isActive = in_array($this->status, [GigOfferStatus::PENDING, GigOfferStatus::ACCEPTED], true)
            && ($this->gig === null || ! in_array($this->gig->status, [GigStatus::Completed, GigStatus::Cancelled, GigStatus::DisputeResolved], true));

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'offered_fee' => $this->offered_fee,
            'note' => $this->note,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'is_active' => $isActive,
            'gig' => $this->whenLoaded('gig', fn () => GigResource::make($this->gig)),
            'freelancer' => $this->whenLoaded('freelancer', fn () => PublicFreelancerResource::make($this->freelancer)),
        ];
    }
}
