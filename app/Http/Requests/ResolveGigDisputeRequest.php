<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
        return ['finding' => ['required', 'string', 'in:client_at_fault,freelancer_at_fault,inconclusive'], 'inconclusive_outcome' => ['nullable', 'string', 'in:full_client_refund,thirty_seventy,full_freelancer_payout'], 'resolution_note' => ['required', 'string', 'max:5000']];
    }
}
