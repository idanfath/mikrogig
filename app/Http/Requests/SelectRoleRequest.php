<?php

namespace App\Http\Requests;

use App\Enums\OnboardingStep;
use App\Enums\UserRole;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SelectRoleRequest extends FormRequest
{
  public function authorize(): bool
  {
    $user = $this->user();

    return $user !== null &&
      $user->onboarding_step === OnboardingStep::PickRole &&
      $user->role === null;
  }

  public function rules(): array
  {
    return [
      'role' => ['required', Rule::enum(UserRole::class)->only(UserRole::selectable())],
    ];
  }

  protected function failedValidation(Validator $validator)
  {
    session()->flash('error', 'Peran yang dipilih tidak valid.');
    parent::failedValidation($validator);
  }
}
