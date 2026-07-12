<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return inertia('auth/login');
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'exists:users,email'],
            'password' => ['required'],
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->with('error', 'Login gagal');
        }
        $v = $validator->validated();

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

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->with('error', 'Daftar gagal. Periksa kembali data Anda.');
        }

        $credentials = $validator->validated();

        $user = User::create($credentials);
        if (method_exists($user, 'sendEmailVerificationNotification')) {
            $user->sendEmailVerificationNotification();
        }

        Auth::login($user);

        return $this->redirectAfterLogin($user)->with('success', 'Daftar berhasil!');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // TODO: Redirect to a custom goodbye page if needed
        return redirect()->route('home')->with('success', 'Logout berhasil!');
    }

    protected function redirectAfterLogin(User $user)
    {
        // TODO: Implement role-based redirection if needed
        return redirect()->intended(route('dashboard'));
    }

    public function showVerificationNotice(User $user)
    {
        if (! $user) {
            return redirect()->back()->with('error', 'Pengguna tidak ditemukan.');
        }

        return inertia('auth/verification/notice', ['id' => $user->id]);
    }

    public function verify(Request $request, User $user)
    {
        if ($user->hasVerifiedEmail()) {
            if (Auth::check()) {
                return redirect()->route('dashboard')->with('success', 'Email kamu sudah diverifikasi.');
            } else {
                return redirect()->route('login')->with('success', 'Email kamu sudah diverifikasi. Silakan login.');
            }
        }

        $user->markEmailAsVerified();

        Auth::login($user);

        return redirect()->route('dashboard')->with('success', 'Email terverifikasi!');

        // or dont log the user and just ask them to relog
        // redirect()->route('login')->with('success', 'Email terverifikasi! Silakan login untuk melanjutkan.');
    }

    public function resendVerification(Request $request)
    {
        $user = User::where('id', $request->id)->first();

        if (! $user || ($user->hasVerifiedEmail())) {
            // Don't reveal that the email doesn't exist / already verified in the system :)
            return back()->with('success', 'Link verifikasi telah dikirim. ');
        }

        logger()->info("Resending verification email to user ID {$user->id} ({$user->email})");

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'Link verifikasi telah dikirim.');
    }

    public function showForgotForm()
    {
        return inertia('auth/forgotPassword');
    }

    public function submitForgot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->with('error', 'Gagal mengirim link reset password.');
        }

        $v = $validator->validated();

        $user = User::where('email', $v['email'])->first();

        if ($user) {
            $user->sendResetPasswordNotification();
        }

        return back()->with('success', 'Link reset password telah dikirim.');
    }

    public function showResetForm(Request $request, User $user)
    {
        return inertia('auth/passwordReset', [
            'id' => $user->id,
        ]);
    }

    public function submitReset(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->with('error', 'Gagal mereset password.');
        }

        $v = $validator->validated();

        $user->password = $v['password'];
        $user->save();

        Auth::login($user);

        return redirect()->route('dashboard')->with('success', 'Password berhasil direset!');
    }
}
