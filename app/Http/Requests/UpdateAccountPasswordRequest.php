<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateAccountPasswordRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return $this->user() !== null;
  }

  /**
   * Get the validation rules that apply to the request.
   *
   * @return array<string, ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    $hasPassword = filled($this->user()?->password);

    $rules = [
      'password' => ['required', 'confirmed', Password::defaults()],
    ];

    if ($hasPassword) {
      $rules['current_password'] = ['required', 'current_password'];
    } else {
      $rules['current_password'] = ['prohibited'];
    }

    return $rules;
  }
}
