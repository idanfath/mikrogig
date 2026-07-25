<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigExitRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'type' => $this->type->value, 'reason' => $this->reason, 'status' => $this->status->value, 'response' => $this->response?->value, 'execution_mode' => $this->execution_mode?->value, 'requester_id' => $this->requester_id, 'responder_id' => $this->responder_id, 'responded_at' => $this->responded_at?->toISOString(), 'withdrawn_at' => $this->withdrawn_at?->toISOString(), 'executed_at' => $this->executed_at?->toISOString()];
    }
}
