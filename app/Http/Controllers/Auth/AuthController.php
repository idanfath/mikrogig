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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $user = User::where('email', $request->validated('email'))->first();

        if ($user) {
            $user->sendResetPasswordNotification();
        }

        return back()->with('success', 'Link reset password telah dikirim.');
    }

    public function showResetForm(Request $request, User $user)
    {
        $email = $request->string('email')->toString();

        $this->ensurePasswordResetEmailMatches($user, $email);

        // signed get only; post must not trust client email field
        $request->session()->put('password_reset', [
            'user_id' => $user->id,
            'email' => strtolower($email),
        ]);

        return inertia('auth/passwordReset', [
            'id' => $user->id,
        ]);
    }

    public function submitReset(ResetPasswordRequest $request, User $user)
    {
        $reset = $request->session()->get('password_reset');

        if (
            ! is_array($reset) ||
            ($reset['user_id'] ?? null) !== $user->id ||
            ! is_string($reset['email'] ?? null)
        ) {
            abort(403);
        }

        $this->ensurePasswordResetEmailMatches($user, $reset['email']);

        $user->password = $request->validated('password');
        $user->save();

        $request->session()->forget('password_reset');

        Auth::login($user);

        return redirect()->route('app.home')->with('success', 'Password berhasil direset!');
    }

    private function ensurePasswordResetEmailMatches(User $user, string $email): void
    {
        if ($email === '' || ! hash_equals(strtolower($user->email), strtolower($email))) {
            abort(403);
        }
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
