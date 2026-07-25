<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreGigFinishRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('submitFinish', $this->route('gig')) ?? false;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'completion_note' => ['required', 'string', 'max:5000'],
            'photos' => ['required', 'array', 'min:1', 'max:5'],
            'photos.*' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'extensions:jpg,jpeg,png,webp', 'dimensions:max_width=12000,max_height=12000', 'max:5120'],
        ];
    }
}
