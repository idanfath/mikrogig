<?php

namespace Database\Factories;

use App\Models\Gig;
use App\Models\GigOffense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigOffense>
 */
class GigOffenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return ['user_id' => User::factory(), 'gig_id' => Gig::factory(), 'sequence' => 1, 'duration_days' => 3];
    }
}
