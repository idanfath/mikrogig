<?php

namespace Database\Factories;

use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigExitRequest;
use App\Models\GigPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigExitRequest>
 */
class GigExitRequestFactory extends Factory
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
            ->state(['gig_id' => Gig::factory()->state(['status' => GigStatus::Locked])]);

        return [
            'gig_id' => fn (): int => $payment->create()->gig_id,
            'requester_id' => fn (array $attributes): int => Gig::query()->findOrFail($attributes['gig_id'])->client_id,
            'responder_id' => fn (array $attributes): int => Gig::query()->findOrFail($attributes['gig_id'])->acceptedOffer->freelancer_id,
            'type' => GigExitType::ClientCancellation,
            'reason' => fake()->sentence(),
            'status' => GigExitStatus::Pending,
        ];
    }
}
