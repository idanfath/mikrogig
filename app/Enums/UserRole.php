<?php

namespace App\Enums;

enum UserRole: string
{
  case User = 'user';
  case Admin = 'admin';

  public static function defaultValue(): string
  {
    return self::User->value;
  }

  public static function values(): array
  {
    return array_column(self::cases(), 'value');
  }
}
