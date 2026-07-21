<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => ['required'],
      'email' => ['required', 'email', 'unique:users,email'],
      'password' => ['required', 'confirmed', Password::defaults()],
    ];
  }

  protected function failedValidation(Validator $validator)
  {
    session()->flash('error', 'Daftar gagal. Periksa kembali data Anda.');
    parent::failedValidation($validator);
  }
}
