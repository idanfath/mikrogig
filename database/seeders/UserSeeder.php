<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Admin', 'email' => 'admin@example.com', 'role' => UserRole::Admin],
            ['name' => 'Freelancer', 'email' => 'freelancer@example.com', 'role' => UserRole::Freelancer],
            ['name' => 'Client', 'email' => 'client@example.com', 'role' => UserRole::Client],
            ['name' => 'Dummy Freelancer 1', 'email' => 'dummy.freelancer1@example.com', 'role' => UserRole::Freelancer],
            ['name' => 'Dummy Freelancer 2', 'email' => 'dummy.freelancer2@example.com', 'role' => UserRole::Freelancer],
            ['name' => 'Dummy Freelancer 3', 'email' => 'dummy.freelancer3@example.com', 'role' => UserRole::Freelancer],
            ['name' => 'Dummy Client 1', 'email' => 'dummy.client1@example.com', 'role' => UserRole::Client],
            ['name' => 'Dummy Client 2', 'email' => 'dummy.client2@example.com', 'role' => UserRole::Client],
            ['name' => 'Dummy Client 3', 'email' => 'dummy.client3@example.com', 'role' => UserRole::Client],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'email_verified_at' => now(),
                    'onboarding_step' => null,
                    'password' => Hash::make('password'),
                ],
            );
        }

        $this->command->info('Seeded users: '.count($users));
    }
}
