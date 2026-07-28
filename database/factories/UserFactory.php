<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\FreelancerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'role' => UserRole::defaultValue(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the user has no password (e.g. Google-only).
     */
    public function withoutPassword(): static
    {
        return $this->state(fn (array $attributes) => [
            'password' => null,
        ]);
    }

    public function freelancer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Freelancer,
        ]);
    }

    public function client(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Client,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (): array => [
            'role' => UserRole::Admin,
        ]);
    }

    public function onboarded(): static
    {
        return $this->state(fn (): array => [
            'date_of_birth' => fake()->dateTimeBetween('-55 years', '-18 years')->format('Y-m-d'),
            'province_id' => '51',
            'regency_id' => '5171',
            'province_name' => 'BALI',
            'regency_name' => 'KOTA DENPASAR',
            'onboarding_step' => null,
        ]);
    }

    public function withFreelancerProfile(): static
    {
        return $this->freelancer()
            ->onboarded()
            ->afterCreating(function (User $user): void {
                FreelancerProfile::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'title' => fake()->randomElement(['Pekerja Harian', 'Petugas Kebersihan', 'Tukang Serbaguna']),
                        'bio' => fake()->sentence(12),
                        'skills' => fake()->randomElements(['Angkut Barang', 'Kebersihan', 'Perbaikan Ringan', 'Penataan'], 2),
                    ],
                );
            });
    }
}
