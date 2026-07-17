<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\RegionCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CompleteOnboardingProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $rules = [
            'date_of_birth' => ['required', 'date', 'before_or_equal:'.now('Asia/Jakarta')->subYears(18)->toDateString()],
            'province_id' => ['required', 'string', 'size:2'],
            'regency_id' => ['required', 'string', 'size:4'],
        ];

        if ($this->user()?->role === UserRole::Freelancer) {
            $rules += [
                'title' => ['required', 'string', 'max:255'],
                'bio' => ['required', 'string'],
                'skills' => ['required', 'array', 'min:1'],
                'skills.*' => ['string'],
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
            },
        ];
    }
}
