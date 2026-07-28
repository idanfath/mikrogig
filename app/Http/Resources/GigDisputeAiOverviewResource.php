<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigDisputeAiOverviewResource extends JsonResource
{
    /**
     * @param  array<string, array<string, mixed>>  $evidenceTargets
     */
    public function __construct($resource, private readonly array $evidenceTargets = [])
    {
        parent::__construct($resource);
    }

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
            'model' => $this->model,
            'prompt_version' => $this->prompt_version,
            'schema_version' => $this->schema_version,
            'failure_detail' => $this->failure_detail,
            'queued_at' => $this->queued_at?->toISOString(),
            'processing_at' => $this->processing_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'failed_at' => $this->failed_at?->toISOString(),
            'repair_attempted_at' => $this->repair_attempted_at?->toISOString(),
            'coverage' => $this->coverage,
            'result' => $this->result,
            'evidence_targets' => $this->evidenceTargets,
        ];
    }
}
