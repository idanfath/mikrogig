<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigDisputeResource extends JsonResource
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
            'gig_id' => $this->gig_id,
            'type' => $this->type->value,
            'status' => $this->status->value,
            'reporter_id' => $this->reporter_id,
            'respondent_id' => $this->respondent_id,
            'reporter' => $this->whenLoaded('reporter', fn () => ['id' => $this->reporter->id, 'name' => $this->reporter->name, 'avatar_url' => $this->reporter->avatar_url]),
            'respondent' => $this->whenLoaded('respondent', fn () => ['id' => $this->respondent->id, 'name' => $this->respondent->name, 'avatar_url' => $this->respondent->avatar_url]),
            'opened_at' => $this->opened_at->toISOString(),
            'counterproof_due_at' => $this->counterproof_due_at->toISOString(),
            'finding' => $this->finding?->value,
            'resolution_note' => $this->resolution_note,
            'resolved_at' => $this->resolved_at?->toISOString(),
            'finish_request' => $this->whenLoaded('finishRequest', fn () => GigFinishRequestResource::make($this->finishRequest)->resolve($request)),
            'submissions' => $this->whenLoaded('submissions', fn () => $this->submissions->map(fn ($submission) => [
                'id' => $submission->id,
                'type' => $submission->type->value,
                'statement' => $submission->statement,
                'submitted_at' => $submission->submitted_at->toISOString(),
                'media' => $submission->relationLoaded('media')
                    ? $submission->media->map(fn ($media) => ['id' => $media->id, 'url' => route('app.gig_dispute_media.show', $media)])->all()
                    : [],
            ])->all()),
        ];
    }
}
