<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\FreelancerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        fake()->seed(20260729);

        $users = [
            ['name' => 'Dewi Anggraini', 'email' => 'admin@example.com', 'role' => UserRole::Admin, 'avatar' => 'database/seeders/assets/avatars/main/admin.webp', 'province_id' => '31', 'regency_id' => '3173', 'province_name' => 'DKI JAKARTA', 'regency_name' => 'KOTA JAKARTA PUSAT'],
            ['name' => 'Raka Saputra', 'email' => 'freelancer@example.com', 'role' => UserRole::Freelancer, 'avatar' => 'database/seeders/assets/avatars/main/freelancer.webp', 'province_id' => '51', 'regency_id' => '5171', 'province_name' => 'BALI', 'regency_name' => 'KOTA DENPASAR', 'title' => 'Pekerja Angkut dan Penataan', 'bio' => 'Berpengalaman membantu pindahan, bongkar muat, dan penataan toko. Terbiasa bekerja rapi sesuai ruang lingkup yang disepakati.', 'skills' => ['Bongkar Muat', 'Pindahan', 'Penataan Barang']],
            ['name' => 'Nadia Pratama', 'email' => 'client@example.com', 'role' => UserRole::Client, 'avatar' => 'database/seeders/assets/avatars/main/client.webp', 'province_id' => '51', 'regency_id' => '5171', 'province_name' => 'BALI', 'regency_name' => 'KOTA DENPASAR'],
            ['name' => 'Budi Santoso', 'email' => 'dummy.freelancer1@example.com', 'role' => UserRole::Freelancer, 'avatar' => 'database/seeders/assets/avatars/support/freelancer/01.webp', 'province_id' => '32', 'regency_id' => '3273', 'province_name' => 'JAWA BARAT', 'regency_name' => 'KOTA BANDUNG', 'title' => 'Tukang Serbaguna', 'bio' => 'Menerima pekerjaan perbaikan ringan rumah dan pengecatan harian.', 'skills' => ['Pengecatan', 'Perbaikan Ringan']],
            ['name' => 'Siti Rahmawati', 'email' => 'dummy.freelancer2@example.com', 'role' => UserRole::Freelancer, 'avatar' => 'database/seeders/assets/avatars/support/freelancer/02.webp', 'province_id' => '34', 'regency_id' => '3471', 'province_name' => 'DI YOGYAKARTA', 'regency_name' => 'KOTA YOGYAKARTA', 'title' => 'Petugas Kebersihan', 'bio' => 'Berpengalaman membersihkan rumah, toko, dan ruangan setelah renovasi.', 'skills' => ['Kebersihan Rumah', 'Kebersihan Toko']],
            ['name' => 'Dedi Kurniawan', 'email' => 'dummy.freelancer3@example.com', 'role' => UserRole::Freelancer, 'avatar' => 'database/seeders/assets/avatars/support/freelancer/03.webp', 'province_id' => '35', 'regency_id' => '3578', 'province_name' => 'JAWA TIMUR', 'regency_name' => 'KOTA SURABAYA', 'title' => 'Pekerja Harian', 'bio' => 'Siap membantu pekerjaan angkut, penataan gudang, dan persiapan acara.', 'skills' => ['Angkut Barang', 'Penataan Gudang', 'Persiapan Acara']],
            ['name' => 'Maya Putri', 'email' => 'dummy.client1@example.com', 'role' => UserRole::Client, 'avatar' => 'database/seeders/assets/avatars/support/client/01.webp', 'province_id' => '32', 'regency_id' => '3273', 'province_name' => 'JAWA BARAT', 'regency_name' => 'KOTA BANDUNG'],
            ['name' => 'Andi Wijaya', 'email' => 'dummy.client2@example.com', 'role' => UserRole::Client, 'avatar' => 'database/seeders/assets/avatars/support/client/02.webp', 'province_id' => '34', 'regency_id' => '3471', 'province_name' => 'DI YOGYAKARTA', 'regency_name' => 'KOTA YOGYAKARTA'],
            ['name' => 'Rina Kusuma', 'email' => 'dummy.client3@example.com', 'role' => UserRole::Client, 'avatar' => 'database/seeders/assets/avatars/support/client/03.webp', 'province_id' => '35', 'regency_id' => '3578', 'province_name' => 'JAWA TIMUR', 'regency_name' => 'KOTA SURABAYA'],
        ];

        foreach ($users as $user) {
            $seeded = User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'avatar' => $user['avatar'],
                    'date_of_birth' => fake()->dateTimeBetween('-52 years', '-20 years')->format('Y-m-d'),
                    'province_id' => $user['province_id'],
                    'regency_id' => $user['regency_id'],
                    'province_name' => $user['province_name'],
                    'regency_name' => $user['regency_name'],
                    'email_verified_at' => now(),
                    'onboarding_step' => null,
                    'password' => Hash::make('password'),
                ],
            );

            if ($user['role'] === UserRole::Freelancer) {
                FreelancerProfile::query()->updateOrCreate(
                    ['user_id' => $seeded->id],
                    [
                        'title' => $user['title'],
                        'bio' => $user['bio'],
                        'skills' => $user['skills'],
                    ],
                );
            }
        }

        $this->command->info('Seeded users: '.count($users));
    }
}
