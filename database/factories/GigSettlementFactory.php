<?php

namespace Database\Factories;

use App\Enums\GigSettlementOutcome;
use App\Models\GigPayment;
use App\Models\GigSettlement;
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
        $payment = GigPayment::factory()->paid();

        return ['gig_id' => fn (array $a) => GigPayment::findOrFail($a['gig_payment_id'])->gig_id, 'gig_payment_id' => $payment, 'total_amount' => 100_000, 'freelancer_payout' => 0, 'client_refund' => 100_000, 'outcome' => GigSettlementOutcome::FullClientRefund, 'recorded_at' => now()];
    }
}
