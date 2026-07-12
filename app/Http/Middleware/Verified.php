<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class Verified
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        // only proceed if user is verified
        if (! $user) {
            return redirect()->route('login')->with('error', 'Anda harus login terlebih dahulu.');
        } elseif (! $user->hasVerifiedEmail()) {
            Auth::logout();
            $url = URL::signedRoute('verification.notice', ['user' => $user->id]);

            return redirect()
                ->to($url)
                ->with('error', 'Mohon verifikasi email Anda.');
        }

        return $next($request);
    }
}
