<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\RegionCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before_or_equal:'.now('Asia/Jakarta')->subYears(18)->toDateString()],
            'province_id' => ['required', 'string', 'size:2'],
            'regency_id' => ['required', 'string', 'size:4'],
            'user_id' => ['prohibited'],
            'role' => ['prohibited'],
            'email' => ['prohibited'],
            'password' => ['prohibited'],
            'province_name' => ['prohibited'],
            'regency_name' => ['prohibited'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'remove_avatar' => ['nullable', 'boolean'],
        ];

        if ($this->user()?->role === UserRole::Freelancer) {
            $rules += [
                'title' => ['required', 'string', 'max:255'],
                'bio' => ['required', 'string', 'max:5000'],
                'skills' => ['required', 'array', 'min:1', 'max:20'],
                'skills.*' => ['required', 'string', 'distinct:strict', 'max:100'],
            ];
        } else {
            $rules += [
                'title' => ['prohibited'],
                'bio' => ['prohibited'],
                'skills' => ['prohibited'],
            ];
        }

        return $rules;
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $regions = app(RegionCatalog::class);
                $provinceId = $this->string('province_id')->toString();
                $regencyId = $this->string('regency_id')->toString();

                if ($provinceId !== '' && $regions->province($provinceId) === null) {
                    $validator->errors()->add('province_id', 'Provinsi tidak valid.');
                }

                if ($provinceId !== '' && $regencyId !== '' && $regions->regency($provinceId, $regencyId) === null) {
                    $validator->errors()->add('regency_id', 'Kabupaten atau kota tidak valid.');
                }

                if ($this->hasFile('avatar') && $this->boolean('remove_avatar')) {
                    $validator->errors()->add('remove_avatar', 'Foto baru dan penghapusan foto tidak dapat dikirim bersamaan.');
                }
            },
        ];
    }
}
