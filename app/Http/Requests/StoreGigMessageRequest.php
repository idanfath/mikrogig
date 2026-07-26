<?php

namespace App\Http\Requests;

use App\Models\GigAgreement;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreGigMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $agreement = $this->route('agreement');

        return $agreement instanceof GigAgreement
            && $this->user()->can('sendMessage', $agreement);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:2000'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => [
                'file',
                'mimetypes:image/jpeg,image/png,image/webp',
                'extensions:jpg,jpeg,png,webp',
                'max:5120',
                'dimensions:max_width=12000,max_height=12000',
            ],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (trim((string) $this->input('body')) === '' && $this->file('images', []) === []) {
                    $validator->errors()->add('body', 'Pesan atau gambar wajib diisi.');
                }
            },
        ];
    }
}
