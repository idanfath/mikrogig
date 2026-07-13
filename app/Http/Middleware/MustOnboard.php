<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class MustOnboard
{
  /**
   * Handle an incoming request.
   *
   * @param  Closure(Request): (Response)  $next
   */
  public function handle(Request $request, Closure $next): Response
  {
    if (!$request->user() || $request->user()->onboarded_at === null) {
      if (!$request->user()->role) {
        return redirect()->route('account.role');
      }
    }

    return $next($request);
  }
}
