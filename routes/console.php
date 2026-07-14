<?php

use App\Models\User;
use App\Services\BanService;
use App\Services\MailService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// debug, dont let this command run in production
Artisan::command('debug:send-example-mail', function () {
    $data = [
        'blocks' => [
            ['type' => 'heading', 'content' => 'Dynamic Email Template'],
            ['type' => 'text', 'content' => "This is a demonstration of the dynamic email layout.\nYou can pass an array of blocks to render various elements like text, buttons, and images."],
            ['type' => 'divider'],
            ['type' => 'heading', 'level' => 3, 'content' => 'Feature List', 'class' => 'text-lg'],
            ['type' => 'text', 'content' => "• Header & Footer on by default\n• Supports custom attributes on buttons\n• Flexible Tailwind CSS classes\n• WebP image support"],
            ['type' => 'spacer', 'height' => '20px'],
            ['type' => 'button', 'label' => 'View Reports', 'url' => route('home'), 'attributes' => ['target' => '_blank', 'id' => 'view-btn']],
        ],
    ];
    $mail = app(MailService::class)->send('zidanfath72@gmail.com', 'Debug Email from '.config('app.name'), $data);
    $this->info('Email sent! Check your inbox (or spam folder).');
})->purpose('Send an email using the MailService');

Artisan::command('user:ban {email}', function ($email) {
    $admin = User::query()->where('role', 'admin')->inRandomOrder()->first();
    $user = User::query()->where('email', $email)->first();
    if (! $user) {
        $this->error("No user found with email: {$email}");

        return;
    }
    app(BanService::class)->ban($user, $admin, 'Banned via console command');
    $this->info("User banned successfully: {$email}");
})->purpose('Ban a user by email');

Artisan::command('user:unban {email}', function ($email) {
    $admin = User::query()->where('role', 'admin')->inRandomOrder()->first();
    $user = User::query()->where('email', $email)->first();
    if (! $user) {
        $this->error("No user found with email: {$email}");

        return;
    }
    app(BanService::class)->unban($user, $admin);
    $this->info("User unbanned successfully: {$email}");
})->purpose('Unban a user by email');

Artisan::command('user:verify {email}', function ($email) {
    $user = User::query()->where('email', $email)->first();
    if (! $user) {
        $this->error("No user found with email: {$email}");

        return;
    }
    $user->markEmailAsVerified();
    $this->info("User verified successfully: {$email}");
})->purpose('Mark a user as email verified by email');

Artisan::command('user:unverify {email}', function ($email) {
    $user = User::query()->where('email', $email)->first();
    if (! $user) {
        $this->error("No user found with email: {$email}");

        return;
    }
    $user->email_verified_at = null;
    $user->save();
    $this->info("User unverified successfully: {$email}");
})->purpose('Mark a user as email unverified by email');

// remove role from user
Artisan::command('role:remove {email}', function ($email) {
    $user = User::query()->where('email', $email)->first();
    if (! $user) {
        $this->error("No user found with email: {$email}");

        return;
    }
    $user->role = null;
    $user->save();
    $this->info("Role removed from user successfully: {$email}");
})->purpose('Remove role from a user by email');

// set onboarding step
Artisan::command('onboarding:set {email} {step}', function ($email, $step) {
    $user = User::query()->where('email', $email)->first();
    if (! $user) {
        $this->error("No user found with email: {$email}");

        return;
    }
    $user->onboarding_step = $step;
    $user->save();
    $this->info("Onboarding step set to '{$step}' for user: {$email}");
})->purpose('Set onboarding step for a user by email');
