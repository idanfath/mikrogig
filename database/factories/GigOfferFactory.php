<?php

namespace Database\Factories;

use App\Enums\GigOfferStatus;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigOffer>
 */
class GigOfferFactory extends Factory
{
    public function definition(): array
    {
        return [
            'gig_id' => Gig::factory(),
            'freelancer_id' => User::factory()->freelancer(),
            'offered_fee' => fake()->numberBetween(50_000, 1_000_000),
            'note' => fake()->optional()->sentence(),
            'status' => GigOfferStatus::PENDING,
        ];
    }

    public function withdrawn(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GigOfferStatus::WITHDRAWN,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GigOfferStatus::REJECTED,
        ]);
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GigOfferStatus::ACCEPTED,
        ]);
    }

    public function autoWithdrawn(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GigOfferStatus::AUTO_WITHDRAWN,
        ]);
    }
}
