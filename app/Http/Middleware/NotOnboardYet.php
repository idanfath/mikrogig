<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class NotOnboardYet
{
  /**
   * Handle an incoming request.
   *
   * @param  Closure(Request): (Response)  $next
   */
  public function handle(Request $request, Closure $next): Response
  {
    if ($request->user() && $request->user()->onboarding_step !== null) {
      return $next($request);
    }

    return redirect()->route('onboarding');
  }
}
