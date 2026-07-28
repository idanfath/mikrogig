<?php

namespace Database\Factories;

use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigDispute;
use App\Models\GigPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigDispute>
 */
class GigDisputeFactory extends Factory
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
            ->state(['gig_id' => Gig::factory()->state(['status' => GigStatus::Disputed])]);

        return [
            'gig_payment_id' => $payment,
            'gig_id' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->gig_id,
            'gig_agreement_id' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->gig_agreement_id,
            'reporter_id' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->gig->client_id,
            'respondent_id' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->agreement->acceptedOffer->freelancer_id,
            'type' => GigDisputeType::NoShow,
            'status' => GigDisputeStatus::AwaitingCounterproof,
            'opened_at' => now(),
            'counterproof_due_at' => now()->addDay(),
        ];
    }

    public function awaitingAdmin(): static
    {
        return $this->state(fn (): array => [
            'status' => GigDisputeStatus::AwaitingAdmin,
        ]);
    }
}
