<?php

namespace Database\Factories;

use App\Enums\GigDisputeSubmissionType;
use App\Models\GigDispute;
use App\Models\GigDisputeSubmission;
use App\Models\User;
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
        return ['gig_dispute_id' => GigDispute::factory(), 'submitted_by' => User::factory(), 'type' => GigDisputeSubmissionType::Report, 'statement' => fake()->paragraph(), 'submitted_at' => now()];
    }
}
