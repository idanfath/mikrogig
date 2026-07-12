<?php

namespace App\Enums;

enum UserRole: string
{
  case Freelancer = 'freelancer';
  case Client = 'client';
  case Admin = 'admin';

  public static function defaultValue(): string
  {
    return self::Freelancer->value;
  }

  public static function values(): array
  {
    return array_column(self::cases(), 'value');
  }
}
