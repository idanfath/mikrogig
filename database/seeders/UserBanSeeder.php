<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserBan;
use Illuminate\Database\Seeder;

class UserBanSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
        $bans = [
            ['email' => 'dummy.freelancer1@example.com', 'reason' => 'Permanent seeded ban', 'banned_until' => null, 'unbanned_at' => null, 'unbanned_by' => null],
            ['email' => 'dummy.client1@example.com', 'reason' => 'Temporary seeded ban', 'banned_until' => now()->addWeek(), 'unbanned_at' => null, 'unbanned_by' => null],
            ['email' => 'dummy.freelancer2@example.com', 'reason' => 'Expired seeded ban', 'banned_until' => now()->subDay(), 'unbanned_at' => null, 'unbanned_by' => null],
            ['email' => 'dummy.client2@example.com', 'reason' => 'Manually unbanned seeded ban', 'banned_until' => null, 'unbanned_at' => now(), 'unbanned_by' => $admin->id],
        ];

        foreach ($bans as $ban) {
            $user = User::query()->where('email', $ban['email'])->firstOrFail();

            UserBan::query()->updateOrCreate(
                ['user_id' => $user->id, 'reason' => $ban['reason']],
                [
                    'banned_by' => $admin->id,
                    'banned_at' => now(),
                    'banned_until' => $ban['banned_until'],
                    'unbanned_at' => $ban['unbanned_at'],
                    'unbanned_by' => $ban['unbanned_by'],
                ],
            );
        }
    }
}
