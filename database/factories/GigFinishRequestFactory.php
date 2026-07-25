<?php

namespace Database\Factories;

use App\Enums\GigFinishRequestStatus;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigFinishRequest;
use App\Models\GigPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigFinishRequest>
 */
class GigFinishRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $payment = GigPayment::factory()->paid()->state([
            'gig_id' => Gig::factory()->state(['status' => GigStatus::Review]),
        ]);

        return [
            'gig_payment_id' => $payment,
            'gig_id' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->gig_id,
            'freelancer_id' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->agreement->acceptedOffer->freelancer_id,
            'status' => GigFinishRequestStatus::Pending,
            'completion_note' => fake()->paragraph(),
            'review_due_at' => now()->addDay(),
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn (): array => [
            'status' => GigFinishRequestStatus::Accepted,
            'accepted_at' => now(),
            'reviewed_by' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->gig->client_id,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (): array => [
            'status' => GigFinishRequestStatus::Rejected,
            'rejected_at' => now(),
            'reviewed_by' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->gig->client_id,
            'rejection_reason' => fake()->sentence(),
        ]);
    }

    public function autoAccepted(): static
    {
        return $this->state(fn (): array => [
            'status' => GigFinishRequestStatus::AutoAccepted,
            'review_due_at' => now()->subMinute(),
            'accepted_at' => now(),
        ]);
    }
}
