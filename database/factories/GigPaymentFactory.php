<?php

namespace Database\Factories;

use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\GigPayment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<GigPayment>
 */
class GigPaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(50_000, 1_000_000);

        return [
            'gig_id' => Gig::factory()->state(['status' => GigStatus::PaymentPending]),
            'gig_agreement_id' => function (array $attributes) use ($amount): int {
                $gig = Gig::query()->findOrFail($attributes['gig_id']);
                $offer = GigOffer::factory()
                    ->for($gig, 'gig')
                    ->state(['status' => GigOfferStatus::ACCEPTED])
                    ->create();

                return GigAgreement::factory()
                    ->for($gig, 'gig')
                    ->for($offer, 'acceptedOffer')
                    ->confirmed()
                    ->create(['final_total_price' => $amount])
                    ->id;
            },
            'amount' => $amount,
            'currency' => 'IDR',
            'local_reference' => (string) Str::ulid(),
            'provider' => 'mock',
            'provider_reference' => null,
            'checkout_url' => null,
            'status' => GigPaymentStatus::Pending,
            'expires_at' => now()->addHours(3),
            'checkout_prepared_at' => null,
            'provider_paid_at' => null,
            'paid_at' => null,
            'cancelled_at' => null,
            'expired_at' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (): array => [
            'status' => GigPaymentStatus::Paid,
            'provider_paid_at' => now(),
            'paid_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (): array => [
            'status' => GigPaymentStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (): array => [
            'status' => GigPaymentStatus::Expired,
            'expires_at' => now()->subMinute(),
            'expired_at' => now(),
        ]);
    }
}
