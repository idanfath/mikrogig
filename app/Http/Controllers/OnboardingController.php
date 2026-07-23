<?php

namespace App\Http\Controllers;

use App\Enums\OnboardingStep;
use App\Http\Requests\CompleteOnboardingProfileRequest;
use App\Http\Requests\SelectRoleRequest;
use App\Http\Requests\SetupAvatarRequest;
use App\RegionCatalog;
use App\Services\UserAvatarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return match ($user->onboarding_step) {
            OnboardingStep::PickRole => inertia('onboarding/role'),
            OnboardingStep::SetupAvatar => inertia('onboarding/avatar'),
            OnboardingStep::Profile => inertia('onboarding/profile', ['max_date_of_birth' => now('Asia/Jakarta')->subYears(18)->toDateString()]),
            default => redirect()->route('app.home'),
        };
    }

    public function selectRole(SelectRoleRequest $request)
    {
        $user = Auth::user();
        $user->role = $request->validated()['role'];
        $user->onboarding_step = OnboardingStep::SetupAvatar;
        $user->save();

        return redirect()->route('onboarding')->with('success', 'Peran berhasil dipilih!');
    }

    public function setupAvatar(SetupAvatarRequest $request, UserAvatarService $avatarService)
    {
        $user = Auth::user();
        $user->onboarding_step = $user->onboarding_step?->next();
        $avatarService->upload($user, $request->file('avatar'));

        return redirect()->route('onboarding')->with('success', 'Foto profil berhasil diperbarui!');
    }

    public function setupProfile(CompleteOnboardingProfileRequest $request, RegionCatalog $regions)
    {
        $user = Auth::user();
        $validated = $request->validated();
        $province = $regions->province($validated['province_id']);
        $regency = $regions->regency($validated['province_id'], $validated['regency_id']);

        DB::transaction(function () use ($user, $validated, $province, $regency): void {
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
                'onboarding_step' => null,
            ]);
        });

        return redirect()->route('app.home')->with('success', 'Profil berhasil dilengkapi!');
    }

    public function skip(Request $request)
    {
        $user = Auth::user();

        abort_unless($user->onboarding_step?->isSkippable() === true, 403);

        $user->onboarding_step = $user->onboarding_step->next();
        $user->save();

        return redirect()->route('onboarding');
    }
}
