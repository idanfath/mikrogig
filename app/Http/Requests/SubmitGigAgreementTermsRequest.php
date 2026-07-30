<?php

namespace App\Http\Requests;

use App\Enums\GigEstimatedDuration;
use App\Models\Gig;
use App\Models\GigAgreement;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitGigAgreementTermsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $gig = $this->route('gig');

        return $gig instanceof Gig
            && ($agreement = $gig->currentAgreement()->first()) instanceof GigAgreement
            && $this->user()?->can('submit', $agreement) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'final_scope' => ['required', 'string', 'max:5000'],
            'work_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'location_arrangement' => ['required', 'string', 'max:1000'],
            'delivery_expectations' => ['required', 'string', 'max:5000'],
            'estimated_duration' => ['required', Rule::enum(GigEstimatedDuration::class)],
            'final_total_price' => ['required', 'integer', 'min:1000', 'max:1000000000'],
            'timezone' => ['nullable', 'string', 'timezone'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $userTz = $this->input('timezone') ?: config('app.timezone');
            try {
                $schedule = CarbonImmutable::parse("{$this->input('work_date')} {$this->input('start_time')}", $userTz)
                    ->setTimezone(config('app.timezone'));

                if (! $schedule->isFuture()) {
                    $validator->errors()->add('start_time', 'Waktu mulai harus di masa depan.');
                }
            } catch (\Throwable) {
                $validator->errors()->add('timezone', 'Zona waktu tidak valid.');
            }
        }];
    }

    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);
        if (! empty($validated['work_date']) && ! empty($validated['start_time'])) {
            $userTz = $this->input('timezone') ?: config('app.timezone');
            try {
                $schedule = CarbonImmutable::parse("{$validated['work_date']} {$validated['start_time']}", $userTz)
                    ->setTimezone(config('app.timezone'));

                $validated['work_date'] = $schedule->toDateString();
                $validated['start_time'] = $schedule->format('H:i');
            } catch (\Throwable) {
                // Keep original if parsing fails
            }
        }
        unset($validated['timezone']);

        return $validated;
    }
}
