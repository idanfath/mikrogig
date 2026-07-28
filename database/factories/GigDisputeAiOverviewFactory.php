<?php

namespace Database\Factories;

use App\Enums\GigDisputeAiOverviewStatus;
use App\Models\GigDispute;
use App\Models\GigDisputeAiOverview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigDisputeAiOverview>
 */
class GigDisputeAiOverviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gig_dispute_id' => GigDispute::factory(),
            'requested_by' => User::factory(),
            'status' => GigDisputeAiOverviewStatus::Queued,
            'model' => 'gpt-4o-mini',
            'prompt_version' => 'v2',
            'schema_version' => 'v2',
            'queued_at' => now(),
        ];
    }
}
