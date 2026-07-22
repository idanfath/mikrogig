<?php

namespace App\Http\Requests;

use App\Enums\OnboardingStep;
use App\Http\Requests\Concerns\ValidatesAvatar;
use Illuminate\Foundation\Http\FormRequest;

class SetupAvatarRequest extends FormRequest
{
  use ValidatesAvatar;

  public function authorize(): bool
  {
    return $this->user()?->onboarding_step === OnboardingStep::SetupAvatar;
  }

  public function rules(): array
  {
    return [
      'avatar' => $this->avatarFileRules(required: true),
    ];
  }
}
