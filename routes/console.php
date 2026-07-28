<?php

use App\Enums\OnboardingStep;
use App\Models\User;
use App\Services\BanService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('gig-payments:expire')->everyMinute()->withoutOverlapping();
Schedule::command('gig-disputes:expire-counterproofs')->everyMinute()->withoutOverlapping();
Schedule::command('gig-finish-requests:auto-accept')->everyMinute()->withoutOverlapping();

// Artisan::command('user:ban {email}', function ($email) {
//     $admin = User::query()->where('role', 'admin')->inRandomOrder()->first();
//     $user = User::query()->where('email', $email)->first();
//     if (! $user) {
//         $this->error("No user found with email: {$email}");

//         return;
//     }
//     app(BanService::class)->ban($user, $admin, 'Banned via console command');
//     $this->info("User banned successfully: {$email}");
// })->purpose('Ban a user by email');

// Artisan::command('user:unban {email}', function ($email) {
//     $admin = User::query()->where('role', 'admin')->inRandomOrder()->first();
//     $user = User::query()->where('email', $email)->first();
//     if (! $user) {
//         $this->error("No user found with email: {$email}");

//         return;
//     }
//     app(BanService::class)->unban($user, $admin);
//     $this->info("User unbanned successfully: {$email}");
// })->purpose('Unban a user by email');

// Artisan::command('user:verify {email}', function ($email) {
//     $user = User::query()->where('email', $email)->first();
//     if (! $user) {
//         $this->error("No user found with email: {$email}");

//         return;
//     }
//     $user->markEmailAsVerified();
//     $this->info("User verified successfully: {$email}");
// })->purpose('Mark a user as email verified by email');

// Artisan::command('user:unverify {email}', function ($email) {
//     $user = User::query()->where('email', $email)->first();
//     if (! $user) {
//         $this->error("No user found with email: {$email}");

//         return;
//     }
//     $user->email_verified_at = null;
//     $user->save();
//     $this->info("User unverified successfully: {$email}");
// })->purpose('Mark a user as email unverified by email');

// // remove role from user
// Artisan::command('role:remove {email}', function ($email) {
//     $user = User::query()->where('email', $email)->first();
//     if (! $user) {
//         $this->error("No user found with email: {$email}");

//         return;
//     }
//     $user->role = null;
//     $user->save();
//     $this->info("Role removed from user successfully: {$email}");
// })->purpose('Remove role from a user by email');

// // set onboarding step
// Artisan::command('onboarding:set {email} {step}', function ($email, $step) {
//     $user = User::query()->where('email', $email)->first();
//     if (! $user) {
//         $this->error("No user found with email: {$email}");

//         return;
//     }

//     if ($step === 'null') {
//         $user->onboarding_step = null;
//     } else {
//         $parsed = OnboardingStep::tryFrom($step);

//         if ($parsed === null) {
//             $this->error("Invalid step: {$step}. Use pick_role, setup_avatar, profile, or null.");

//             return;
//         }

//         $user->onboarding_step = $parsed;
//     }

//     $user->save();
//     $this->info("Onboarding step set to '{$step}' for user: {$email}");
// })->purpose('Set onboarding step for a user by email');
