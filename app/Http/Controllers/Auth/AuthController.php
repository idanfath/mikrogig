<?php

namespace App\Http\Controllers\Auth;

use App\Actions\RegisterUserAction;
use App\Actions\SendUserOnboardingNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use App\Services\UserAvatarService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return inertia('auth/login');
    }

    public function login(LoginRequest $request)
    {
        $v = $request->validated();

        if (Auth::attempt($v)) {
            $request->session()->regenerate();

            return $this->redirectAfterLogin(Auth::user())->with('success', 'Login berhasil!');
        }

        return back()->with('error', 'Email atau password salah');
    }

    public function showRegistrationForm()
    {
        return inertia('auth/register');
    }

    public function register(RegisterRequest $request, RegisterUserAction $registerUser)
    {
        $user = $registerUser->execute($request->validated());

        Auth::login($user);

        return $this->redirectAfterLogin($user)->with('success', 'Daftar berhasil!');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')->with('success', 'Logout berhasil!');
    }

    protected function redirectAfterLogin(User $user)
    {
        if (! $user->hasVerifiedEmail()) {
            return redirect()->signedRoute('verification.notice', ['user' => $user->id]);
        }

        if ($user->onboarding_step) {
            return redirect()->route('onboarding');
        }

        return redirect()->intended(route('app.home'));
    }

    public function showVerificationNotice(User $user)
    {
        if (! $user) {
            return redirect()->back()->with('error', 'Pengguna tidak ditemukan.');
        }

        return inertia('auth/verificationNotice', ['id' => $user->id]);
    }

    public function verify(Request $request, User $user)
    {
        if ($user->hasVerifiedEmail()) {
            if (Auth::check()) {
                return redirect()->route('app.home')->with('success', 'Email kamu sudah diverifikasi.');
            } else {
                return redirect()->route('login')->with('success', 'Email kamu sudah diverifikasi. Silakan login.');
            }
        }

        $user->markEmailAsVerified();

        Auth::login($user);

        // return redirect()->route('app.home')->with('success', 'Email terverifikasi!');
        // nah we dont log the user and just ask them to relog
        return redirect()->route('login')->with('success', 'Email terverifikasi! Silakan login untuk melanjutkan.');
    }

    public function resendVerification(Request $request)
    {
        $user = Auth::user();

        logger()->info("Resending verification email to user ID {$user->id} ({$user->email})");

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'Link verifikasi telah dikirim.');
    }

    public function showForgotForm()
    {
        return inertia('auth/forgotPassword');
    }

    public function submitForgot(ForgotPasswordRequest $request)
    {
        Password::sendResetLink($request->only('email'));

        return back()->with('success', 'Link reset password telah dikirim.');
    }

    public function showResetForm(Request $request, string $token)
    {
        return inertia('auth/passwordReset', [
            'token' => $token,
            'email' => $request->string('email')->toString(),
        ]);
    }

    public function submitReset(ResetPasswordRequest $request)
    {
        $validated = $request->validated();
        $resetUser = null;

        $status = Password::reset(
            [
                'email' => $validated['email'],
                'password' => $validated['password'],
                'token' => $validated['token'],
            ],
            function (User $user, string $password) use (&$resetUser, $request): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));

                DB::table(config('session.table'))
                    ->where('user_id', $user->id)
                    ->delete();

                Auth::login($user);
                $request->session()->regenerate();
                $resetUser = $user;
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return back()->with('error', 'Gagal mereset password.');
        }

        return $this->redirectAfterLogin($resetUser)->with('success', 'Password berhasil direset!');
    }

    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if ($user) {
                if (! $user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'email_verified_at' => $user->email_verified_at ?? now(),
                    ]);
                }
            } else {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'email_verified_at' => now(),
                ]);

                app(SendUserOnboardingNotifications::class)->execute($user);
            }

            if (! $user->avatar && $avatarUrl = $googleUser->getAvatar()) {
                app(UserAvatarService::class)->importFromUrl($user, $avatarUrl);
            }

            Auth::login($user);

            $user->refresh();

            return $this->redirectAfterLogin($user)->with('success', 'Login berhasil!');
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Login Google gagal: '.$e->getMessage());
        }
    }
}
