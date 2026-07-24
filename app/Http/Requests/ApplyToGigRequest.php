<?php

namespace App\Http\Requests;

use App\Models\Gig;
use Illuminate\Foundation\Http\FormRequest;

class ApplyToGigRequest extends FormRequest
{
    public function authorize(): bool
    {
        $gig = $this->route('gig');

        return $gig instanceof Gig && $this->user()?->can('apply', $gig) === true;
    }

    public function rules(): array
    {
        return [
            'offered_fee' => ['nullable', 'integer', 'min:1000'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
