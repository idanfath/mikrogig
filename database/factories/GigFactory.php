<?php

namespace Database\Factories;

use App\Enums\GigCategory;
use App\Enums\GigEstimatedDuration;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\User;
use App\Services\WageBenchmarkService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Gig>
 */
class GigFactory extends Factory
{
    public function definition(): array
    {
        $duration = fake()->randomElement(GigEstimatedDuration::cases());
        $benchmark = (new WageBenchmarkService)->calculate('11', $duration);
        $postedFee = fake()->randomElement([
            max(1_000, $benchmark['minimum'] - 10_000),
            $benchmark['minimum'],
            $benchmark['maximum'] + 10_000,
        ]);

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
            'estimated_duration' => $duration,
            'posted_fee' => $postedFee,
            'wage_benchmark_minimum' => $benchmark['minimum'],
            'wage_benchmark_maximum' => $benchmark['maximum'],
            'wage_benchmark_year' => $benchmark['year'],
        ];
    }
}
