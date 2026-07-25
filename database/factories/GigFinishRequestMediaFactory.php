<?php

namespace Database\Factories;

use App\Models\GigFinishRequest;
use App\Models\GigFinishRequestMedia;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<GigFinishRequestMedia>
 */
class GigFinishRequestMediaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gig_finish_request_id' => GigFinishRequest::factory(),
            'path' => 'gig-workflow/'.Str::uuid().'.jpg',
        ];
    }
}
