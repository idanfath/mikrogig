<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\BanService;
use App\Services\NotificationService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserBanSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $banService = app()->make(BanService::class, ['sendEmail' => false]);
    $this->command->info('Seeding user bans... (skip sending emails)');

    $users = User::query()
      ->where('email', '!=', 'admin@example.com')
      ->where('email', '!=', 'user@example.com')
      ->where('role', UserRole::User->value)
      ->inRandomOrder()
      ->limit(rand(5, 12))
      ->get();

    $admin = User::query()->where('role', UserRole::Admin->value);
    $this->command->info("Banning {$users->count()} users");
    foreach ($users as $user) {
      $banService->ban($user, $admin->inRandomOrder()->first(), fake()->sentence(), rand(1, 100) <= 80 ? now()->addDays(rand(1, 30)) : null);
    }

    $usersToUnbanCount = rand(2, 3);
    $this->command->info("Unbanning {$usersToUnbanCount} users");
    $usersToUnban = User::query()
      ->whereHas('bans', function ($query) {
        $query->whereNull('unbanned_at');
      })
      ->where('role', UserRole::User->value)
      ->inRandomOrder()
      ->limit($usersToUnbanCount)
      ->get();
    foreach ($usersToUnban as $user) {
      $banService->unban($user, $admin->inRandomOrder()->first());
    }
  }
}
