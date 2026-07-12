<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class RoleCheck
{
  /**
   * Handle an incoming request.
   *
   * @param  Closure(Request): (Response)  $next
   */
  public function handle(Request $request, Closure $next, string ...$roles): Response
  {
    if (!$request->user() || !in_array($request->user()->role, $roles)) {
      abort(403, 'Unauthorized');
    }

    return $next($request);
  }
}
