<?php

namespace Database\Factories;

use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigOffense;
use App\Models\GigPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigOffense>
 */
class GigOffenseFactory extends Factory
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
            ->state(['gig_id' => Gig::factory()->state(['status' => GigStatus::DisputeResolved])]);

        return [
            'gig_id' => fn (): int => $payment->create()->gig_id,
            'user_id' => fn (array $attributes): int => Gig::query()->findOrFail($attributes['gig_id'])->acceptedOffer->freelancer_id,
            'sequence' => 1,
            'duration_days' => 3,
        ];
    }
}
