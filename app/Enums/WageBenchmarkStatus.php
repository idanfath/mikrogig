<?php

namespace App\Enums;

enum WageBenchmarkStatus: string
{
    case Below = 'below';
    case Within = 'within';
    case Meets = 'meets';

    public static function forAmount(int $amount, int $minimum, int $maximum): self
    {
        if ($amount < $minimum) {
            return self::Below;
        }

        if ($amount < $maximum) {
            return self::Within;
        }

        return self::Meets;
    }
}
