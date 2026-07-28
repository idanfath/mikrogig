<?php

namespace Database\Factories;

use App\Enums\GigDisputeSubmissionType;
use App\Models\GigDispute;
use App\Models\GigDisputeSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigDisputeSubmission>
 */
class GigDisputeSubmissionFactory extends Factory
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
            'submitted_by' => fn (array $attributes): int => GigDispute::query()->findOrFail($attributes['gig_dispute_id'])->reporter_id,
            'type' => GigDisputeSubmissionType::Report,
            'statement' => fake()->paragraph(),
            'submitted_at' => now(),
        ];
    }

    public function counterproof(): static
    {
        return $this->state(fn (): array => [
            'submitted_by' => fn (array $attributes): int => GigDispute::query()->findOrFail($attributes['gig_dispute_id'])->respondent_id,
            'type' => GigDisputeSubmissionType::Counterproof,
        ]);
    }
}
