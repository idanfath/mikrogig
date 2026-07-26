<?php

namespace Database\Factories;

use App\Enums\GigMessageKind;
use App\Enums\GigWorkflowEvent;
use App\Models\GigAgreement;
use App\Models\GigMessage;
use App\Models\GigOffer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigMessage>
 */
class GigMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gig_agreement_id' => GigAgreement::factory(),
            'sender_id' => fn (array $attributes): int => GigAgreement::query()
                ->findOrFail($attributes['gig_agreement_id'])
                ->gig
                ->client_id,
            'recipient_id' => fn (array $attributes): int => GigOffer::query()
                ->findOrFail(GigAgreement::query()->findOrFail($attributes['gig_agreement_id'])->gig_offer_id)
                ->freelancer_id,
            'kind' => GigMessageKind::User,
            'body' => fake()->sentence(),
            'workflow_event' => null,
            'event_key' => null,
            'event_snapshot' => null,
            'read_at' => null,
        ];
    }

    public function system(): static
    {
        return $this->state(fn (): array => [
            'sender_id' => null,
            'recipient_id' => null,
            'kind' => GigMessageKind::System,
            'body' => null,
            'workflow_event' => GigWorkflowEvent::FreelancerSelected,
            'event_key' => fake()->uuid(),
            'event_snapshot' => ['title' => 'Freelancer dipilih'],
        ]);
    }

    public function read(): static
    {
        return $this->state(fn (): array => ['read_at' => now()]);
    }
}
