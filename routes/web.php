<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

Route::inertia('/', 'home')->name('home');

// authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
    Route::get('/register', [AuthController::class, 'showRegistrationForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->name('register.submit');
    // password reset
    Route::get('/password/forgot', [AuthController::class, 'showForgotForm'])->name('password.forgot');
    Route::post('/password/forgot', [AuthController::class, 'submitForgot'])->name('password.forgot.submit')->middleware('throttle:2,1');
    Route::get('/password/reset/{user}', [AuthController::class, 'showResetForm'])->name('password.reset')->middleware('signed');
    Route::post('/password/reset/{user}', [AuthController::class, 'submitReset'])->name('password.reset.submit')->middleware('throttle:3,1');
    // google oauth
    Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

// email verification
Route::get('/email/verify/{user}', [AuthController::class, 'verify'])->middleware(['signed', 'throttle:2,1'])->name('verification.verify');

Route::middleware(['auth'])->group(function () {
    Route::get('/email/verify/notice/{user}', [AuthController::class, 'showVerificationNotice'])->name('verification.notice')->middleware(['signed', 'unverified']);  // permanent link with email as param, but signed to prevent tampering
    Route::post('/email/verify/resend', [AuthController::class, 'resendVerification'])->name('verification.send')->middleware(['throttle:1,1', 'unverified']);  // limit to 1 request per minute
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

// onboarding process
Route::middleware(['auth', 'verified', 'no_banned_user'])->prefix('onboarding')->group(function () {
    Route::get('/', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('/role', [OnboardingController::class, 'selectRole'])->name('onboarding.role');
    Route::post('/avatar', [OnboardingController::class, 'setupAvatar'])->name('onboarding.avatar');
    Route::post('/profile', [OnboardingController::class, 'setupProfile'])->name('onboarding.profile');
    Route::post('/enhance', [OnboardingController::class, 'enhanceInputField'])->name('onboarding.enhance');
    Route::post('/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');
});

Route::middleware(['auth', 'no_banned_user', 'verified', 'must_onboard'])->group(function () {
    // Route::get('/dashboard', function () {
    //     $user = Auth::user();
    //     $inbox = app(NotificationService::class)->inbox($user->id)->items();

    //     return Inertia::render('temporaryDashboard', [
    //         'user' => $user,
    //         'inbox' => $inbox,
    //     ]);
    // })->name('dashboard');

    Route::group(['prefix' => 'app'], function () {
        Route::get('/', [AppController::class, 'index'])->name('app.home');
        Route::get('/notifications', [NotificationController::class, 'index'])->name('app.notifications');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('app.notifications.read-all');
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('app.notifications.read');
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('app.notifications.destroy');
    });
});
