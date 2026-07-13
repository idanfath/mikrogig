<?php

use App\Http\Controllers\AccountSetupController;
use App\Http\Controllers\Auth\AuthController;
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
});

// email verification
Route::get('/email/verify/{user}', [AuthController::class, 'verify'])->middleware(['signed', 'throttle:2,1'])->name('verification.verify');
Route::get('/email/verify/notice/{user}', [AuthController::class, 'showVerificationNotice'])->name('verification.notice')->middleware('signed');  // permanent link with email as param, but signed to prevent tampering

Route::middleware(['auth'])->group(function () {
    Route::post('/email/verify/resend', [AuthController::class, 'resendVerification'])->name('verification.send')->middleware('throttle:1,1');  // limit to 1 request per minute
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::middleware(['auth', 'no_banned_user', 'verified'])->prefix('account')->group(function () {
    Route::get('/role', [AccountSetupController::class, 'showRoleSelection'])->name('account.role');
    Route::post('/role/{role}', [AccountSetupController::class, 'selectRole'])->name('account.role.select');
});

Route::middleware(['auth', 'no_banned_user', 'verified', 'must_onboard'])->group(function () {
    Route::get('/dashboard', function () {
        $user = Auth::user();
        $inbox = app(NotificationService::class)->inbox($user->id)->items();

        return Inertia::render('temporaryDashboard', [
            'user' => $user,
            'inbox' => $inbox,
        ]);
    })->name('dashboard');
});
