<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            UserBanSeeder::class,
        ]);
        if (file_exists(database_path('seeders/RealAccountSeeder.php'))) {
            /** @var class-string<Seeder> $seeder */
            $seeder = 'Database\Seeders\RealAccountSeeder';
            $this->call($seeder);
        }
    }
}
