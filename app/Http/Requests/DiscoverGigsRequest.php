<?php

namespace App\Http\Requests;

use App\Enums\GigCategory;
use App\Models\Gig;
use App\RegionCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class DiscoverGigsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Gig::class) === true;
    }

    public function rules(): array
    {
        return [
            'province_id' => ['nullable', 'string'],
            'regency_id' => ['nullable', 'string', 'required_with:province_id'],
            'category' => ['nullable', Rule::enum(GigCategory::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'minimum_fee' => ['nullable', 'integer', 'min:1000', 'max:1000000000'],
            'maximum_fee' => ['nullable', 'integer', 'min:1000', 'max:1000000000', 'gte:minimum_fee'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $provinceId = $this->string('province_id')->toString();
                $regencyId = $this->string('regency_id')->toString();

                if ($provinceId === '') {
                    return;
                }

                $regions = app(RegionCatalog::class);

                if ($regions->province($provinceId) === null) {
                    $validator->errors()->add('province_id', 'Provinsi tidak valid.');
                }

                if ($regencyId !== '' && $regions->regency($provinceId, $regencyId) === null) {
                    $validator->errors()->add('regency_id', 'Kabupaten/kota tidak valid untuk provinsi tersebut.');
                }
            },
        ];
    }
}
