<?php

namespace Database\Factories;

use App\Enums\GigSettlementOutcome;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigPayment;
use App\Models\GigSettlement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigSettlement>
 */
class GigSettlementFactory extends Factory
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
            'gig_payment_id' => $payment,
            'gig_id' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->gig_id,
            'total_amount' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->amount,
            'freelancer_payout' => 0,
            'client_refund' => fn (array $attributes): int => GigPayment::query()->findOrFail($attributes['gig_payment_id'])->amount,
            'outcome' => GigSettlementOutcome::FullClientRefund,
            'recorded_at' => now(),
        ];
    }
}
