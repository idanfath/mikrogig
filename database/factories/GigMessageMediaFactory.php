<?php

namespace Database\Factories;

use App\Models\GigMessage;
use App\Models\GigMessageMedia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GigMessageMedia>
 */
class GigMessageMediaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gig_message_id' => GigMessage::factory(),
            'path' => 'gig-messages/'.fake()->uuid().'.jpg',
            'mime_type' => 'image/jpeg',
            'display_order' => 0,
        ];
    }
}
