<?php

namespace App\Http\Requests;

use App\Enums\OnboardingStep;
use App\Http\Requests\Concerns\ValidatesProfileFields;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CompleteOnboardingProfileRequest extends FormRequest
{
    use ValidatesProfileFields;

    public function authorize(): bool
    {
        return $this->user()?->onboarding_step === OnboardingStep::Profile;
    }

    public function rules(): array
    {
        return [
            ...$this->profileLocationRules(),
            ...$this->freelancerProfileRules(),
        ];
    }

    public function after(): array
    {
        return [
            fn (Validator $validator) => $this->validateRegionIds($validator),
        ];
    }
}
