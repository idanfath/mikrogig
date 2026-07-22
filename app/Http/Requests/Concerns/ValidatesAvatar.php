<?php

namespace App\Http\Requests\Concerns;

trait ValidatesAvatar
{
    /**
     * @return list<string>
     */
    protected function avatarFileRules(bool $required = false): array
    {
        return [
            $required ? 'required' : 'nullable',
            'image',
            'mimes:jpeg,png,webp',
            'max:5120',
        ];
    }
}
