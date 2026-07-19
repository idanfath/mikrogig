<?php

use App\Enums\UserRole;
use App\Models\FreelancerProfile;
use App\Models\User;
use App\RegionCatalog;
use App\Services\ProfileEnhancementService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(LazilyRefreshDatabase::class);

function completeProfileUser(): User
{
    $user = User::factory()->create([
        'role' => UserRole::Freelancer,
        'onboarding_step' => null,
    ]);

    FreelancerProfile::create([
        'user_id' => $user->id,
        'title' => 'Tukang Las',
        'bio' => 'Berpengalaman.',
        'skills' => ['las'],
    ]);

    return $user;
}

function validProfilePayload(): array
{
    $regions = app(RegionCatalog::class);
    $province = $regions->provinces()[0];
    $regency = $regions->regencies($province['id'])[0];

    return [
        'name' => 'Nama Baru',
        'date_of_birth' => now('Asia/Jakarta')->subYears(20)->toDateString(),
        'province_id' => $province['id'],
        'regency_id' => $regency['id'],
        'title' => 'Tukang Bangunan',
        'bio' => 'Bio baru',
        'skills' => ['Bangunan', 'LAS'],
    ];
}

test('owner receives private profile fields', function () {
    $user = completeProfileUser();

    $this->actingAs($user)
        ->get(route('app.profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/user/profile')
            ->where('is_owner', true)
            ->has('profile.email')
            ->has('profile.date_of_birth')
            ->has('profile.province_id')
            ->has('profile.freelancer_profile.skills', 1));
});

test('other users do not receive private profile fields', function () {
    $viewer = completeProfileUser();
    $target = completeProfileUser();

    $this->actingAs($viewer)
        ->get(route('app.profile.show', $target))
        ->assertInertia(fn (Assert $page) => $page
            ->where('is_owner', false)
            ->has('profile', fn (Assert $profile) => $profile
                ->where('id', $target->id)
                ->missing('email')
                ->missing('date_of_birth')
                ->missing('province_id')
                ->has('freelancer_profile', fn (Assert $freelancer) => $freelancer
                    ->has('title')
                    ->has('bio')
                    ->has('skills', 1))
                ->etc()));
});

test('hidden profile targets return not found', function () {
    $viewer = completeProfileUser();
    $target = User::factory()->create(['onboarding_step' => 'profile']);

    $this->actingAs($viewer)
        ->get(route('app.profile.show', $target))
        ->assertNotFound();
});

test('profile update changes only authenticated user permitted fields', function () {
    $user = completeProfileUser();
    $otherUser = completeProfileUser();
    $payload = validProfilePayload();

    $this->actingAs($user)
        ->put(route('app.profile.update'), [...$payload, 'user_id' => $otherUser->id])
        ->assertSessionHasErrors('user_id');

    $this->actingAs($user)
        ->put(route('app.profile.update'), $payload)
        ->assertRedirect(route('app.profile'));

    expect($user->refresh())
        ->name->toBe('Nama Baru')
        ->role->toBe(UserRole::Freelancer);
    expect($otherUser->refresh()->name)->not->toBe('Nama Baru');
    expect($user->freelancerProfile->skills)->toBe(['bangunan', 'las']);
});

test('profile save replaces avatar in cos storage', function () {
    Storage::fake('cos');
    $user = completeProfileUser();
    $oldAvatar = 'avatars/old-avatar.jpg';
    Storage::disk('cos')->put($oldAvatar, 'old avatar');
    $user->update(['avatar' => $oldAvatar]);

    $this->actingAs($user)
        ->post(route('app.profile.update'), [
            ...validProfilePayload(),
            '_method' => 'PUT',
            'avatar' => UploadedFile::fake()->image('avatar.png'),
        ])
        ->assertRedirect(route('app.profile'));

    $path = $user->refresh()->avatar;
    Storage::disk('cos')->assertExists($path);
    Storage::disk('cos')->assertMissing($oldAvatar);
});

test('profile save removes avatar in cos storage', function () {
    Storage::fake('cos');
    $user = completeProfileUser();
    $oldAvatar = 'avatars/old-avatar.jpg';
    Storage::disk('cos')->put($oldAvatar, 'old avatar');
    $user->update(['avatar' => $oldAvatar]);

    $this->actingAs($user)
        ->post(route('app.profile.update'), [
            ...validProfilePayload(),
            '_method' => 'PUT',
            'remove_avatar' => true,
        ])
        ->assertRedirect(route('app.profile'));

    Storage::disk('cos')->assertMissing($oldAvatar);
    expect($user->refresh()->avatar)->toBeNull();
});

test('profile avatar update rejects replacement and removal together', function () {
    Storage::fake('cos');
    $user = completeProfileUser();
    $oldAvatar = 'avatars/old-avatar.jpg';
    Storage::disk('cos')->put($oldAvatar, 'old avatar');
    $user->update(['avatar' => $oldAvatar]);

    $this->actingAs($user)
        ->post(route('app.profile.update'), [
            ...validProfilePayload(),
            '_method' => 'PUT',
            'avatar' => UploadedFile::fake()->image('avatar.png'),
            'remove_avatar' => true,
        ])
        ->assertSessionHasErrors('remove_avatar');

    expect($user->refresh()->avatar)->toBe($oldAvatar);
    Storage::disk('cos')->assertExists($oldAvatar);
});

test('invalid profile avatar keeps existing avatar', function () {
    Storage::fake('cos');
    $user = completeProfileUser();
    $oldAvatar = 'avatars/old-avatar.jpg';
    Storage::disk('cos')->put($oldAvatar, 'old avatar');
    $user->update(['avatar' => $oldAvatar]);

    $this->actingAs($user)
        ->post(route('app.profile.update'), [
            ...validProfilePayload(),
            '_method' => 'PUT',
            'avatar' => UploadedFile::fake()->create('avatar.txt', 10, 'text/plain'),
        ])
        ->assertSessionHasErrors('avatar');

    expect($user->refresh()->avatar)->toBe($oldAvatar);
    Storage::disk('cos')->assertExists($oldAvatar);
});

test('standalone avatar routes are unavailable', function () {
    $user = completeProfileUser();

    $this->actingAs($user)
        ->post('/app/profile/avatar')
        ->assertMethodNotAllowed();
});

test('freelancer enhancement returns JSON', function () {
    $user = completeProfileUser();
    $this->mock(ProfileEnhancementService::class)
        ->shouldReceive('enhance')
        ->once()
        ->andReturn('Tukang Las Profesional');

    $this->actingAs($user)
        ->postJson(route('freelancer.enhance'), [
            'field' => 'title',
            'value' => 'Tukang Las',
            'context' => [],
        ])
        ->assertSuccessful()
        ->assertJsonPath('value', 'Tukang Las Profesional');
});

test('client enhancement is forbidden as JSON', function () {
    $user = User::factory()->create([
        'role' => UserRole::Client,
        'onboarding_step' => null,
    ]);

    $this->actingAs($user)
        ->postJson(route('freelancer.enhance'), ['field' => 'title'])
        ->assertForbidden()
        ->assertJsonPath('error', 'Fitur ini hanya tersedia untuk freelancer.');
});
