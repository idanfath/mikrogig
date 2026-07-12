<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class UserSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    if (!User::query()->where('email', 'admin@example.com')->exists()) {
      $this->command->info('Creating default admin user');
      User::factory()->create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
        'role' => UserRole::Admin->value,
      ]);
    } else {
      $this->command->info('Admin user already exists. Skipping..');
    }

    if (!User::query()->where('email', 'user@example.com')->exists()) {
      $this->command->info('Creating freelancer user');
      User::factory()->unverified()->create([
        'name' => 'Regular User',
        'email' => 'zidanfath72@gmail.com',
        'role' => UserRole::Freelancer->value,
      ]);
    } else {
      $this->command->info('Freelancer user already exists. Skipping..');
    }

    $newUser = 20;
    $this->command->info("Creating {$newUser} additional users");
    User::factory($newUser)->create();
    $newAdmin = 1;
    $this->command->info("Creating {$newAdmin} additional admin");
    User::factory($newAdmin)->create([
      'role' => UserRole::Admin->value,
    ]);

    $usersCount = User::query()->count();
    $this->command->info("Total users in database: {$usersCount}");
  }
}
