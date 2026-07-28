<?php

namespace App\Http\Requests;

use App\Enums\GigDisputeFinding;
use App\Enums\GigSettlementOutcome;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResolveGigDisputeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('resolve', $this->route('dispute')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'finding' => ['required', Rule::enum(GigDisputeFinding::class)],
            'inconclusive_outcome' => [
                'exclude_unless:finding,'.GigDisputeFinding::Inconclusive->value,
                'required',
                Rule::enum(GigSettlementOutcome::class),
            ],
            'resolution_note' => ['required', 'string', 'max:5000'],
        ];
    }
}
