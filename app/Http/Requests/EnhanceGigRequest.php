<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class EnhanceGigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Client;
    }

    public function rules(): array
    {
        return [
            'field' => ['required', 'in:title,description'],
            'value' => ['nullable', 'string', 'max:5000'],
            'context' => ['nullable', 'array'],
            'context.title' => ['nullable', 'string', 'max:255'],
            'context.description' => ['nullable', 'string', 'max:5000'],
            'context.category' => ['nullable', 'string', 'max:100'],
        ];
    }

    protected function failedAuthorization(): void
    {
        if ($this->expectsJson()) {
            throw new HttpResponseException(response()->json([
                'error' => 'Fitur ini hanya tersedia untuk klien.',
            ], 403));
        }

        parent::failedAuthorization();
    }
}
