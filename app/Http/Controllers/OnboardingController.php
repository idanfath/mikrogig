<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompleteOnboardingProfileRequest;
use App\Models\User;
use App\RegionCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class OnboardingController extends Controller
{
  public function show(Request $request)
  {
    $user = $request->user();

    return match ($user->onboarding_step) {
      'pick_role' => inertia('onboarding/role'),
      'setup_avatar' => inertia('onboarding/avatar'),
      'profile' => inertia('onboarding/profile', ['max_date_of_birth' => now('Asia/Jakarta')->subYears(18)->toDateString()]),
      default => redirect()->route('app.home'),
    };
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

    $user = Auth::user();

    if ($user->role !== null) {
      return back()->with('error', 'Peran sudah dipilih sebelumnya.');
    }

    $user->role = $validator->validated()['role'];
    $user->onboarding_step = 'setup_avatar';
    $user->save();

    return redirect()->route('onboarding')->with('success', 'Peran berhasil dipilih!');
  }

  public function setupAvatar(Request $request)
  {
    $request->validate([
      'avatar' => 'required|image|mimes:jpeg,png,webp|max:5120',
    ]);

    $user = Auth::user();
    $user->updateAvatar($request->file('avatar'));
    $user->onboarding_step = $this->nextStep($user);
    $user->save();

    return redirect()->route('onboarding')->with('success', 'Foto profil berhasil diperbarui!');
  }

  public function setupProfile(CompleteOnboardingProfileRequest $request, RegionCatalog $regions)
  {
    $user = Auth::user();
    $validated = $request->validated();
    $province = $regions->province($validated['province_id']);
    $regency = $regions->regency($validated['province_id'], $validated['regency_id']);

    if ($user->role->value === 'freelancer') {
      $user->freelancerProfile()->updateOrCreate(
        ['user_id' => $user->id],
        [
          'title' => $validated['title'],
          'bio' => $validated['bio'],
          'skills' => array_map('strtolower', $validated['skills']),
        ],
      );
    }

    $user->update([
      'date_of_birth' => $validated['date_of_birth'],
      'province_id' => $validated['province_id'],
      'regency_id' => $validated['regency_id'],
      'province_name' => $province['name'],
      'regency_name' => $regency['name'],
    ]);

    $user->onboarding_step = null;
    $user->save();

    return redirect()->route('app.home')->with('success', 'Profil berhasil dilengkapi!');
  }

  public function skip(Request $request)
  {
    $user = Auth::user();
    $user->onboarding_step = $this->nextStep($user);
    $user->save();

    return redirect()->route('onboarding');
  }

  private function nextStep(User $user): ?string
  {
    return match ($user->onboarding_step) {
      'setup_avatar' => 'profile',
      'profile' => null,
      default => $user->onboarding_step,
    };
  }
}
