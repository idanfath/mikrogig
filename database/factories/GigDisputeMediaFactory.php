<?php

namespace Database\Factories;

use App\Models\GigDisputeMedia;
use App\Models\GigDisputeMedia;
use App\Models\GigDisputeSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigDisputeMedia>
 */
class GigDisputeMediaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return ['gig_dispute_submission_id' => GigDisputeSubmission::factory(), 'path' => 'disputes/'.fake()->uuid().'.jpg'];
    }
}
