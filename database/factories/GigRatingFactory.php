<?php

namespace Database\Factories;

use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigPayment;
use App\Models\GigRating;
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
        $payment = GigPayment::factory()
            ->paid()
            ->state(['gig_id' => Gig::factory()->state(['status' => GigStatus::Completed])]);

        return [
            'gig_id' => fn (): int => $payment->create()->gig_id,
            'rater_id' => fn (array $attributes): int => Gig::query()->findOrFail($attributes['gig_id'])->client_id,
            'recipient_id' => fn (array $attributes): int => Gig::query()->findOrFail($attributes['gig_id'])->acceptedOffer->freelancer_id,
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
