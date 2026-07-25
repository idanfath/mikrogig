<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicFreelancerResource extends JsonResource
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
            'name' => $this->name,
            'avatar_url' => $this->avatar_url,
            'location' => $this->location,
            'freelancer_profile' => $this->whenLoaded('freelancerProfile', fn (): array => [
                'title' => $this->freelancerProfile?->title,
                'bio' => $this->freelancerProfile?->bio,
                'skills' => $this->freelancerProfile?->skills ?? [],
            ]),
        ];
    }
}
