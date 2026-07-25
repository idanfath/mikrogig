<?php

namespace App\Http\Resources;

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
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'offered_fee' => $this->offered_fee,
            'note' => $this->note,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'gig' => $this->whenLoaded('gig', fn () => GigResource::make($this->gig)),
            'freelancer' => $this->whenLoaded('freelancer', fn () => PublicFreelancerResource::make($this->freelancer)),
        ];
    }
}
