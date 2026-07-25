<?php

namespace Database\Factories;

use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Models\GigDispute;
use App\Models\GigPayment;
use App\Models\User;
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
        $payment = GigPayment::factory()->paid();

        return ['gig_id' => fn (array $a) => GigPayment::findOrFail($a['gig_payment_id'])->gig_id, 'gig_agreement_id' => fn (array $a) => GigPayment::findOrFail($a['gig_payment_id'])->gig_agreement_id, 'gig_payment_id' => $payment, 'reporter_id' => User::factory(), 'respondent_id' => User::factory(), 'type' => GigDisputeType::NoShow, 'status' => GigDisputeStatus::AwaitingCounterproof, 'opened_at' => now(), 'counterproof_due_at' => now()->addDay()];
    }
}
