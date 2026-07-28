import { NotificationCategory } from '@/types/enum';
import type { NotificationCategory as NotificationCategoryValue } from '@/types/enum';

const NOTIFICATION_TOAST_PREFERENCES_STORAGE_KEY = 'notification_toast_preferences';
const LEGACY_NOTIFICATION_TOASTS_ENABLED_STORAGE_KEY = 'notification_toasts_enabled';

export type NotificationToastPreferences = Record<NotificationCategoryValue, boolean>;

const defaultPreferences: NotificationToastPreferences = {
  [NotificationCategory.System]: true,
  [NotificationCategory.Chat]: true,
};

function normalizeCategory(category?: string): NotificationCategoryValue {
  return category === NotificationCategory.Chat
    ? NotificationCategory.Chat
    : NotificationCategory.System;
}

export function getNotificationToastPreferences(): NotificationToastPreferences {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  try {
    const stored = localStorage.getItem(NOTIFICATION_TOAST_PREFERENCES_STORAGE_KEY);

    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }

    const legacy = localStorage.getItem(LEGACY_NOTIFICATION_TOASTS_ENABLED_STORAGE_KEY);

    if (legacy !== null) {
      const enabled = legacy !== 'false';

      return {
        [NotificationCategory.System]: enabled,
        [NotificationCategory.Chat]: enabled,
      };
    }
  } catch {
    return defaultPreferences;
  }

  return defaultPreferences;
}

export function areNotificationToastsEnabled(category?: string): boolean {
  return (
    areAllNotificationToastsEnabled() &&
    getNotificationToastPreferences()[normalizeCategory(category)]
  );
}

export function areAllNotificationToastsEnabled(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return localStorage.getItem(LEGACY_NOTIFICATION_TOASTS_ENABLED_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setAllNotificationToastsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(LEGACY_NOTIFICATION_TOASTS_ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    return;
  }
}

export function setNotificationToastEnabled(
  category: NotificationCategoryValue,
  enabled: boolean,
): NotificationToastPreferences {
  const preferences = {
    ...getNotificationToastPreferences(),
    [category]: enabled,
  };

  try {
    localStorage.setItem(
      NOTIFICATION_TOAST_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    return preferences;
  }

  return preferences;
}
