<?php

namespace App\Enums;

enum UserRoleFrontendLabel: string
{
    case freelancer = 'Pekerja';
    case client = 'Pemberi Kerja';
    case admin = 'Admin';
}
