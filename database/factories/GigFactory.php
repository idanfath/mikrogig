<?php

namespace Database\Factories;

use App\Enums\GigCategory;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Gig>
 */
class GigFactory extends Factory
{
    public function definition(): array
    {
        return [
            'client_id' => User::factory()->client(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(GigCategory::cases()),
            'status' => GigStatus::Open,
            'province_id' => '11',
            'regency_id' => '1101',
            'province_name' => 'Aceh',
            'regency_name' => 'Simeulue',
            'location_address' => fake()->address(),
            'location_latitude' => null,
            'location_longitude' => null,
            'location_accuracy_meters' => null,
            'work_date' => fake()->dateTimeBetween('+1 day', '+1 year')->format('Y-m-d'),
            'start_time' => fake()->time(),
            'posted_fee' => fake()->numberBetween(50_000, 1_000_000),
        ];
    }
}
