<?php

use App\Http\Controllers\Auth\AuthController;
use App\Models\User;
use App\Services\CompressionService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
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
  // email verification
  Route::get('/email/verify/notice/{user}', [AuthController::class, 'showVerificationNotice'])->name('verification.notice')->middleware('signed');  // permanent link with email as param, but signed to prevent tampering
  Route::post('/email/verify/resend', [AuthController::class, 'resendVerification'])->name('verification.send')->middleware('throttle:1,1');  // limit to 1 request per minute
  Route::get('/email/verify/{user}', [AuthController::class, 'verify'])->middleware(['signed', 'throttle:2,1'])->name('verification.verify');
});
Route::middleware(['auth', 'no_banned_user'])->group(function () {
  Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::post('/compress', function (Request $request) {
  $validator = Validator::make($request->all(), [
    'image' => ['required', 'file', 'image', 'max:10240'],  // max 10MB
    'format' => ['nullable', 'string', 'in:jpg,png,webp'],
    'quality' => ['nullable', 'integer', 'between:0,100'],
    'maxWidth' => ['nullable', 'integer', 'min:1'],
    'maxHeight' => ['nullable', 'integer', 'min:1'],
  ]);

  if ($validator->fails()) {
    return response()->json(['error' => $validator->errors()->first()], 422);
  }

  $v = $validator->validated();

  $service = app(CompressionService::class);

  $file = $request->file('image');
  $content = file_get_contents($file->getRealPath());
  try {
    $compressed = $service->compress(
      $content,
      $v['format'] ?? null,
      [
        'quality' => $v['quality'] ?? null,
        'maxWidth' => $v['maxWidth'] ?? null,
        'maxHeight' => $v['maxHeight'] ?? null,
      ]
    );
  } catch (\Exception $e) {
    return response()->json(['error' => 'Compression failed: ' . $e->getMessage()], 500);
  }

  return response($compressed)->header('Content-Type', mime_content_type($file->getRealPath()));
})->name('compress');

Route::middleware(['auth', 'no_banned_user', 'verified'])->group(function () {
  Route::get('/dashboard', function () {
    $user = Auth::user();
    $inbox = app(NotificationService::class)->inbox($user->id)->items();
    return Inertia::render('temporaryDashboard', [
      'user' => $user,
      'inbox' => $inbox,
    ]);
  })->name('dashboard');
});
