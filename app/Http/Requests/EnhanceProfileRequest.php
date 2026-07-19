<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class EnhanceProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Freelancer;
    }

    public function rules(): array
    {
        return [
            'field' => ['required', 'in:title,bio,skills'],
            'value' => ['nullable', 'string', 'max:5000'],
            'context' => ['nullable', 'array'],
            'context.title' => ['nullable', 'string', 'max:255'],
            'context.bio' => ['nullable', 'string', 'max:5000'],
            'context.skills' => ['nullable', 'array', 'max:20'],
            'context.skills.*' => ['string', 'max:100'],
            'context.location' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function failedAuthorization(): void
    {
        if ($this->expectsJson()) {
            throw new HttpResponseException(response()->json([
                'error' => 'Fitur ini hanya tersedia untuk freelancer.',
            ], 403));
        }

        parent::failedAuthorization();
    }
}
