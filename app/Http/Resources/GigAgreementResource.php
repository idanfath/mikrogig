<?php

namespace App\Http\Resources;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigAgreementResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'accepted_fee' => $this->accepted_fee,
            'final_scope' => $this->final_scope,
            'work_date' => $this->work_date?->toDateString(),
            'start_time' => $this->start_time === null ? null : substr($this->start_time, 0, 5),
            'scheduled_at' => $this->work_date && $this->start_time
                ? CarbonImmutable::parse($this->work_date->toDateString().' '.$this->start_time, config('app.timezone'))->toIso8601String()
                : null,
            'location_arrangement' => $this->location_arrangement,
            'delivery_expectations' => $this->delivery_expectations,
            'final_total_price' => $this->final_total_price,
            'terms_version' => $this->terms_version,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'change_requested_at' => $this->change_requested_at?->toISOString(),
            'freelancer_confirmed_at' => $this->freelancer_confirmed_at?->toISOString(),
            'latest_change_request_note' => $this->latest_change_request_note,
        ];
    }
}
