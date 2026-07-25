<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreGigDisputeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('workflow', $this->route('gig')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return ['type' => ['required', 'string', 'in:no_show,start_blocked'], 'statement' => ['required', 'string', 'max:5000'], 'photos' => ['required', 'array', 'min:1', 'max:5'], 'photos.*' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'extensions:jpg,jpeg,png,webp', 'dimensions:max_width=12000,max_height=12000', 'max:5120']];
    }
}
