<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigResource extends JsonResource
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
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category->value,
            'status' => $this->status->value,
            'province_id' => $this->province_id,
            'regency_id' => $this->regency_id,
            'province_name' => $this->province_name,
            'regency_name' => $this->regency_name,
            'location_address' => $this->location_address,
            'location_latitude' => $this->location_latitude,
            'location_longitude' => $this->location_longitude,
            'location_accuracy_meters' => $this->location_accuracy_meters,
            'work_date' => $this->work_date->toDateString(),
            'start_time' => $this->start_time,
            'posted_fee' => $this->posted_fee,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'media' => $this->whenLoaded('media', fn () => $this->media->map(fn ($media): array => [
                'id' => $media->id,
                'url' => $media->url,
            ])->all()),
            'client' => $this->whenLoaded('client', fn (): array => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'avatar_url' => $this->client->avatar_url,
                'location' => $this->client->location,
            ]),
            'pending_applicants_count' => $this->whenCounted('pending_applicants'),
        ];
    }
}
