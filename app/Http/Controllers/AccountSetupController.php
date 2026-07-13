<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccountSetupController extends Controller
{
  public function showRoleSelection()
  {
    return inertia('onboarding/pickRole');
  }

  public function selectRole(Request $request)
  {
    $validator = Validator::make($request->all(), [
      'role' => ['required', 'in:freelancer,client'],
    ]);

    if ($validator->fails()) {
      return back()
        ->withErrors($validator)
        ->with('error', 'Peran yang dipilih tidak valid.');
    }

    $v = $validator->validated();

    $user = $request->user();
    $user->role = $v['role'];
    $user->save();

    return redirect()->route('dashboard')->with('success', 'Peran berhasil dipilih!');
  }
}
