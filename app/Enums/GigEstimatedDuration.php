<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum GigEstimatedDuration: string
{
    use HasValues;

    case UnderOneHour = 'under_1_hour';
    case OneToTwoHours = '1_2_hours';
    case TwoToFourHours = '2_4_hours';
    case FourToSixHours = '4_6_hours';
    case SixToEightHours = '6_8_hours';
    case OneToTwoDays = '1_2_days';
    case ThreeToFiveDays = '3_5_days';

    public function label(): string
    {
        return match ($this) {
            self::UnderOneHour => 'Kurang dari 1 jam',
            self::OneToTwoHours => '1–2 jam',
            self::TwoToFourHours => '2–4 jam',
            self::FourToSixHours => '4–6 jam',
            self::SixToEightHours => '6–8 jam',
            self::OneToTwoDays => '1–2 hari',
            self::ThreeToFiveDays => '3–5 hari',
        };
    }

    public function minimumHours(): int
    {
        return match ($this) {
            self::UnderOneHour, self::OneToTwoHours => 1,
            self::TwoToFourHours => 2,
            self::FourToSixHours => 4,
            self::SixToEightHours => 6,
            self::OneToTwoDays => 8,
            self::ThreeToFiveDays => 24,
        };
    }

    public function maximumHours(): int
    {
        return match ($this) {
            self::UnderOneHour => 1,
            self::OneToTwoHours => 2,
            self::TwoToFourHours => 4,
            self::FourToSixHours => 6,
            self::SixToEightHours => 8,
            self::OneToTwoDays => 16,
            self::ThreeToFiveDays => 40,
        };
    }
}
