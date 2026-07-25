<?php

namespace App\Http\Requests;

use App\Models\Gig;
use App\Models\GigAgreement;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

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
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'final_scope' => ['required', 'string', 'max:5000'],
            'work_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'location_arrangement' => ['required', 'string', 'max:1000'],
            'delivery_expectations' => ['required', 'string', 'max:5000'],
            'final_total_price' => ['required', 'integer', 'min:1000', 'max:1000000000'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($validator->errors()->isNotEmpty() || $this->input('work_date') !== now(config('app.timezone'))->toDateString()) {
                return;
            }

            $schedule = CarbonImmutable::parse("{$this->input('work_date')} {$this->input('start_time')}", config('app.timezone'));
            if (! $schedule->isFuture()) {
                $validator->errors()->add('start_time', 'Waktu mulai harus di masa depan.');
            }
        }];
    }
}
