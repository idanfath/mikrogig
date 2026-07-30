<?php

namespace Database\Factories;

use App\Enums\GigAgreementClosureReason;
use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigAgreement>
 */
class GigAgreementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gig_id' => Gig::factory()->state(['status' => GigStatus::AgreementPreparation]),
            'gig_offer_id' => fn (array $attributes): int => GigOffer::factory()
                ->for(Gig::query()->findOrFail($attributes['gig_id']), 'gig')
                ->state(['status' => GigOfferStatus::ACCEPTED])
                ->create()
                ->id,
            'accepted_fee' => fn (array $attributes): int => GigOffer::query()->findOrFail($attributes['gig_offer_id'])->offered_fee,
            'estimated_duration' => fn (array $attributes) => Gig::query()->findOrFail($attributes['gig_id'])->estimated_duration,
            'final_scope' => fake()->paragraph(),
            'work_date' => fake()->dateTimeBetween('+1 day', '+1 year')->format('Y-m-d'),
            'start_time' => fake()->time(),
            'location_arrangement' => fake()->address(),
            'delivery_expectations' => fake()->sentence(),
            'final_total_price' => fn (array $attributes): int => GigOffer::query()->findOrFail($attributes['gig_offer_id'])->offered_fee,
            'wage_benchmark_minimum' => fn (array $attributes): int => Gig::query()->findOrFail($attributes['gig_id'])->wage_benchmark_minimum,
            'wage_benchmark_maximum' => fn (array $attributes): int => Gig::query()->findOrFail($attributes['gig_id'])->wage_benchmark_maximum,
            'wage_benchmark_year' => fn (array $attributes): int => Gig::query()->findOrFail($attributes['gig_id'])->wage_benchmark_year,
            'terms_version' => 0,
            'submitted_at' => null,
            'change_requested_at' => null,
            'freelancer_confirmed_at' => null,
            'closed_at' => null,
            'latest_change_request_note' => null,
            'closure_reason' => null,
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn (): array => [
            'terms_version' => 1,
            'submitted_at' => now(),
        ]);
    }

    public function confirmed(): static
    {
        return $this->submitted()->state(fn (): array => [
            'freelancer_confirmed_at' => now(),
        ]);
    }

    public function closed(GigAgreementClosureReason $reason = GigAgreementClosureReason::FreelancerDeclined): static
    {
        return $this->state(fn (): array => [
            'closed_at' => now(),
            'closure_reason' => $reason,
        ]);
    }
}
