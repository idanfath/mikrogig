<?php

namespace App\Http\Requests;

use App\Enums\GigCategory;
use App\Models\Gig;
use App\RegionCatalog;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreGigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Gig::class) === true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:5000'],
            'category' => ['required', Rule::enum(GigCategory::class)],
            'province_id' => ['required', 'string'],
            'regency_id' => ['required', 'string'],
            'location_address' => ['required', 'string', 'max:1000'],
            'location_latitude' => ['nullable', 'numeric', 'required_with:location_longitude', 'between:-90,90'],
            'location_longitude' => ['nullable', 'numeric', 'required_with:location_latitude', 'between:-180,180'],
            'location_accuracy_meters' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'work_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'posted_fee' => ['required', 'integer', 'between:1000,1000000000'],
            'photos' => ['required', 'array', 'min:1', 'max:5'],
            'photos.*' => [
                'required',
                'file',
                'mimetypes:image/jpeg,image/png,image/webp',
                'extensions:jpg,jpeg,png,webp',
                'max:5120',
                'dimensions:max_width=12000,max_height=12000',
            ],
        ];
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
                    $validator->errors()->add('regency_id', 'Kabupaten/kota tidak valid untuk provinsi tersebut.');
                }

                if ($this->filled('work_date') && $this->filled('start_time')) {
                    $scheduledAt = Carbon::createFromFormat(
                        'Y-m-d H:i',
                        $this->input('work_date').' '.$this->input('start_time'),
                        config('app.timezone'),
                    );

                    if ($scheduledAt->isToday() && $scheduledAt->isPast()) {
                        $validator->errors()->add('start_time', 'Waktu mulai hari ini harus di masa depan.');
                    }
                }
            },
        ];
    }
}
