<?php

namespace App\Http\Requests\Concerns;

use App\Enums\UserRole;
use App\RegionCatalog;
use Illuminate\Validation\Validator;

trait ValidatesProfileFields
{
    /**
     * @return array<string, mixed>
     */
    protected function profileLocationRules(): array
    {
        return [
            'date_of_birth' => ['required', 'date', 'before_or_equal:'.now('Asia/Jakarta')->subYears(18)->toDateString()],
            'province_id' => ['required', 'string', 'size:2'],
            'regency_id' => ['required', 'string', 'size:4'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function freelancerProfileRules(): array
    {
        if ($this->user()?->role === UserRole::Freelancer) {
            return [
                'title' => ['required', 'string', 'max:255'],
                'bio' => ['required', 'string', 'max:5000'],
                'skills' => ['required', 'array', 'min:1', 'max:20'],
                'skills.*' => ['required', 'string', 'distinct:strict', 'max:100'],
            ];
        }

        return [
            'title' => ['prohibited'],
            'bio' => ['prohibited'],
            'skills' => ['prohibited'],
        ];
    }

    protected function validateRegionIds(Validator $validator): void
    {
        $regions = app(RegionCatalog::class);
        $provinceId = $this->string('province_id')->toString();
        $regencyId = $this->string('regency_id')->toString();

        if ($provinceId !== '' && $regions->province($provinceId) === null) {
            $validator->errors()->add('province_id', 'Provinsi tidak valid.');
        }

        if ($provinceId !== '' && $regencyId !== '' && $regions->regency($provinceId, $regencyId) === null) {
            $validator->errors()->add('regency_id', 'Kabupaten atau kota tidak valid.');
        }
    }
}
