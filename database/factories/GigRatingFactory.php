<?php

namespace Database\Factories;

use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigRating;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigRating>
 */
class GigRatingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gig_id' => Gig::factory()->state(['status' => GigStatus::Completed]),
            'rater_id' => User::factory()->client(),
            'recipient_id' => User::factory()->freelancer(),
            'score' => fake()->numberBetween(1, 5),
            'comment' => fake()->optional()->sentence(),
        ];
    }

    public function score(int $score): static
    {
        return $this->state(fn (): array => ['score' => $score]);
    }

    public function withoutComment(): static
    {
        return $this->state(fn (): array => ['comment' => null]);
    }
}
