<?php

namespace Database\Factories;

use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Models\Gig;
use App\Models\GigExitRequest;
use App\Models\User;
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
        $gig = Gig::factory();
        $requester = User::factory()->client();

        return ['gig_id' => $gig, 'requester_id' => $requester, 'responder_id' => User::factory()->freelancer(), 'type' => GigExitType::ClientCancellation, 'reason' => fake()->sentence(), 'status' => GigExitStatus::Pending];
    }
}
