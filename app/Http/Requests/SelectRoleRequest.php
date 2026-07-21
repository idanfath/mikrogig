<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class SelectRoleRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'role' => ['required', 'in:freelancer,client'],
    ];
  }

  protected function failedValidation(Validator $validator)
  {
    session()->flash('error', 'Peran yang dipilih tidak valid.');
    parent::failedValidation($validator);
  }
}
