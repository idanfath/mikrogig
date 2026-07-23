<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        session()->flash('error', 'Gagal mengirim link reset password.');
        parent::failedValidation($validator);
    }
}
