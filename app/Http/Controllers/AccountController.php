<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAccountPasswordRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
  public function index(Request $request): Response
  {
    $user = $request->user();

    return Inertia::render('app/user/account', [
      'hasPassword' => filled($user->password),
    ]);
  }

  public function updatePassword(UpdateAccountPasswordRequest $request): RedirectResponse
  {
    $user = $request->user();
    $user->password = $request->validated('password');
    $user->save();

    return back()->with('success', 'Password berhasil disimpan.');
  }
}
