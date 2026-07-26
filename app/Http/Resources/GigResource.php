<?php

namespace App\Http\Resources;

use Carbon\CarbonImmutable;
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
        $user = $request->user();
        $isOwner = $user && $user->id === $this->client_id;
        $isAcceptedFreelancer = $user && $this->acceptedOffer && $this->acceptedOffer->freelancer_id === $user->id;
        $canSeeExactLocation = $isOwner || $isAcceptedFreelancer;

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
            'location_address' => $this->when($canSeeExactLocation, $this->location_address),
            'location_latitude' => $this->when($canSeeExactLocation, $this->location_latitude),
            'location_longitude' => $this->when($canSeeExactLocation, $this->location_longitude),
            'location_accuracy_meters' => $this->when($canSeeExactLocation, $this->location_accuracy_meters),
            'work_date' => $this->work_date->toDateString(),
            'start_time' => $this->start_time === null ? null : substr($this->start_time, 0, 5),
            'scheduled_at' => $this->work_date && $this->start_time
                ? CarbonImmutable::parse($this->work_date->toDateString().' '.$this->start_time, config('app.timezone'))->toIso8601String()
                : null,
            'posted_fee' => $this->posted_fee,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'started_at' => $this->started_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
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
