<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesAvatar;
use App\Http\Requests\Concerns\ValidatesProfileFields;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProfileRequest extends FormRequest
{
  use ValidatesAvatar;
  use ValidatesProfileFields;

  public function authorize(): bool
  {
    return $this->user() !== null;
  }

  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:255'],
      ...$this->profileLocationRules(),
      'user_id' => ['prohibited'],
      'role' => ['prohibited'],
      'email' => ['prohibited'],
      'password' => ['prohibited'],
      'province_name' => ['prohibited'],
      'regency_name' => ['prohibited'],
      'avatar' => $this->avatarFileRules(),
      'remove_avatar' => ['nullable', 'boolean'],
      ...$this->freelancerProfileRules(),
    ];
  }

  public function after(): array
  {
    return [
      function (Validator $validator): void {
        $this->validateRegionIds($validator);

        if ($this->hasFile('avatar') && $this->boolean('remove_avatar')) {
          $validator->errors()->add('remove_avatar', 'Foto baru dan penghapusan foto tidak dapat dikirim bersamaan.');
        }
      },
    ];
  }
}
