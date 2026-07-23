<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\EnhanceProfileRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use App\Services\ProfileEnhancementService;
use App\Services\UserAvatarService;
use App\RegionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Arr;

class ProfileController extends Controller
{
  public function index(Request $request)
  {
    return $this->renderProfile($request->user(), $request->user());
  }

  public function show(Request $request, User $user)
  {
    $this->authorize('view', $user);

    return $this->renderProfile($user, $request->user());
  }

  public function update(UpdateProfileRequest $request, RegionCatalog $regions, UserAvatarService $avatarService)
  {
    $validated = $request->validated();
    $user = $request->user();

    $province = $regions->province($validated['province_id']);
    $regency = $regions->regency($validated['province_id'], $validated['regency_id']);

    $newAvatar = null;

    try {
      DB::transaction(function () use ($request, $user, $validated, $province, $regency, $avatarService, &$newAvatar): void {
        $user->update([
          ...Arr::only($validated, ['name', 'date_of_birth', 'province_id', 'regency_id']),
          'province_name' => $province['name'],
          'regency_name' => $regency['name'],
        ]);

        if ($user->role === UserRole::Freelancer) {
          $user->freelancerProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
              'title' => $validated['title'],
              'bio' => $validated['bio'],
              'skills' => array_values(array_unique(array_map('strtolower', $validated['skills']))),
            ],
          );
        }

        if ($request->hasFile('avatar')) {
          $newAvatar = $avatarService->upload($user, $request->file('avatar'));
        } elseif ($request->boolean('remove_avatar')) {
          $avatarService->remove($user);
        }
      });
    } catch (\Throwable $exception) {
      if ($newAvatar !== null) {
        Storage::disk('cos')->delete($newAvatar);
      }

      throw $exception;
    }

    return to_route('app.profile')->with('success', 'Profil berhasil diperbarui.');
  }

  public function enhance(EnhanceProfileRequest $request, ProfileEnhancementService $profileEnhancementService): JsonResponse
  {
    $validated = $request->validated();

    try {
      return response()->json([
        'value' => $profileEnhancementService->enhance(
          $validated['field'],
          $validated['value'] ?? null,
          $validated['context'] ?? [],
        ),
      ]);
    } catch (\Throwable $exception) {
      report($exception);

      return response()->json([
        'error' => 'Peningkatan gagal.',
      ], 500);
    }
  }

  private function renderProfile(User $profile, User $viewer)
  {
    $profile->load('freelancerProfile');
    $isOwner = $profile->is($viewer);

    $profileData = [
      'id' => $profile->id,
      'name' => $profile->name,
      'avatar_url' => $profile->avatar_url,
      'role' => $profile->role?->value,
      'location' => $profile->location,
    ];

    if ($profile->role === UserRole::Freelancer) {
      $profileData['freelancer_profile'] = [
        'title' => $profile->freelancerProfile?->title,
        'bio' => $profile->freelancerProfile?->bio,
        'skills' => $profile->freelancerProfile?->skills ?? [],
      ];
    }

    if ($isOwner) {
      $profileData = [
        ...$profileData,
        'email' => $profile->email,
        'date_of_birth' => $profile->date_of_birth?->toDateString(),
        'province_id' => $profile->province_id,
        'regency_id' => $profile->regency_id,
      ];
    }

    return inertia('app/user/profile', [
      'profile' => $profileData,
      'is_owner' => $isOwner,
      'has_custom_avatar' => $isOwner && $profile->avatar !== null,
      'max_date_of_birth' => $isOwner ? now('Asia/Jakarta')->subYears(18)->toDateString() : null,
    ]);
  }
}
