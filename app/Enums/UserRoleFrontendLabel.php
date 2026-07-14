<?php

namespace App\Enums;

enum UserRoleFrontendLabel: string
{
    case freelancer = 'Pekerja';
    case client = 'Pemberi Kerja';
    case admin = 'Admin';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
