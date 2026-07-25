<?php

namespace Database\Factories;

use App\Models\Gig;
use App\Models\GigMedia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigMedia>
 */
class GigMediaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'gig_id' => Gig::factory(),
            'path' => 'gigs/'.fake()->uuid().'.jpg',
        ];
    }
}
