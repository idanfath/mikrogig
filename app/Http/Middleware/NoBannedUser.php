<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class NoBannedUser
{
  /**
   * Handle an incoming request.
   *
   * @param  Closure(Request): (Response)  $next
   */
  public function handle(Request $request, Closure $next): Response
  {
    $user = $request->user();

    // isbanned will do a query on every user request, it's negligible for current scale so we'll not optimize this.
    if ($user && $user->is_banned) {
      Auth::logout();
      $request->session()->invalidate();
      $request->session()->regenerateToken();

      return redirect()
        ->route('login')
        ->with('error', 'Akun Anda telah diblokir.');
    }

    return $next($request);
  }
}
