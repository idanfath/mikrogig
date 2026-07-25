<?php

namespace App\Http\Requests;

use App\Models\Gig;
use App\Models\GigAgreement;
use Illuminate\Foundation\Http\FormRequest;

class RequestGigAgreementChangesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $gig = $this->route('gig');

        return $gig instanceof Gig
            && ($agreement = $gig->currentAgreement()->first()) instanceof GigAgreement
            && $this->user()?->can('respond', $agreement) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'max:1000'],
        ];
    }
}
