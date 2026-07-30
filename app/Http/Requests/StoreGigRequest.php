<?php

namespace App\Http\Requests;

use App\Enums\GigCategory;
use App\Enums\GigEstimatedDuration;
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
            'location_accuracy_meters' => ['nullable', 'integer', 'min:0', 'max:20000000'],
            'work_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'estimated_duration' => ['required', Rule::enum(GigEstimatedDuration::class)],
            'posted_fee' => ['required', 'integer', 'between:1000,1000000000'],
            'timezone' => ['nullable', 'string', 'timezone'],
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

                if ($provinceId !== '' && ! is_int(config("wage-benchmarks.provinces.{$provinceId}"))) {
                    $validator->errors()->add('province_id', 'Acuan upah belum tersedia untuk provinsi ini.');
                }

                if ($provinceId !== '' && $regencyId !== '' && $regions->regency($provinceId, $regencyId) === null) {
                    $validator->errors()->add('regency_id', 'Kabupaten/kota tidak valid untuk provinsi tersebut.');
                }

                if ($this->filled('work_date') && $this->filled('start_time')) {
                    $userTz = $this->input('timezone') ?: config('app.timezone');
                    try {
                        $scheduledAt = Carbon::createFromFormat(
                            'Y-m-d H:i',
                            $this->input('work_date').' '.$this->input('start_time'),
                            $userTz,
                        )->setTimezone(config('app.timezone'));

                        if ($scheduledAt->isToday() && $scheduledAt->isPast()) {
                            $validator->errors()->add('start_time', 'Waktu mulai hari ini harus di masa depan.');
                        }
                    } catch (\Throwable) {
                        $validator->errors()->add('timezone', 'Zona waktu tidak valid.');
                    }
                }
            },
        ];
    }

    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);
        if (! empty($validated['work_date']) && ! empty($validated['start_time'])) {
            $userTz = $this->input('timezone') ?: config('app.timezone');
            try {
                $scheduledAt = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $validated['work_date'].' '.$validated['start_time'],
                    $userTz,
                )->setTimezone(config('app.timezone'));

                $validated['work_date'] = $scheduledAt->toDateString();
                $validated['start_time'] = $scheduledAt->format('H:i');
            } catch (\Throwable) {
                // Keep original if parsing fails
            }
        }
        unset($validated['timezone']);

        return $validated;
    }
}
