<?php

namespace App\Enums;

enum NotificationTargetType: string
{
  case Everyone = 'everyone';
  case Role = 'role';
  case Users = 'users';
  case User = 'user';

  public static function defaultValue(): string
  {
    return self::Everyone->value;
  }

  public static function values(): array
  {
    return array_column(self::cases(), 'value');
  }
}
