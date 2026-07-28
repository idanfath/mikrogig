import { BellRing } from 'lucide-react';
import { useState } from 'react';
import { AppPageCard } from '@/components/layout/app-page';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { NotificationCategory } from '@/types/enum';
import type { NotificationCategory as NotificationCategoryValue } from '@/types/enum';
import {
  areAllNotificationToastsEnabled,
  getNotificationToastPreferences,
  setAllNotificationToastsEnabled,
  setNotificationToastEnabled,
} from '../lib/notification-toast-preference';

const toastCategories: Array<{
  category: NotificationCategoryValue;
  title: string;
  description: string;
}> = [
  {
    category: NotificationCategory.Chat,
    title: 'Pesan',
    description: 'Pesan baru dari percakapan gig.',
  },
  {
    category: NotificationCategory.System,
    title: 'Aktivitas',
    description: 'Pembaruan gig, akun, dan aktivitas sistem.',
  },
];

export function NotificationToastPreference() {
  const [allEnabled, setAllEnabled] = useState(areAllNotificationToastsEnabled);
  const [preferences, setPreferences] = useState(getNotificationToastPreferences);

  const updateEnabled = (
    category: NotificationCategoryValue,
    enabled: boolean,
  ): void => {
    setPreferences(setNotificationToastEnabled(category, enabled));
  };

  const updateAllEnabled = (enabled: boolean): void => {
    setAllEnabled(enabled);
    setAllNotificationToastsEnabled(enabled);
  };

  return (
    <AppPageCard className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BellRing className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground leading-tight">
            Notifikasi pop-up
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Notifikasi tetap masuk ke halaman Notifikasi saat pop-up dimatikan.
          </p>
        </div>
      </div>

      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Semua notifikasi pop-up</FieldTitle>
          <FieldDescription>
            Matikan untuk menyembunyikan semua pemberitahuan pop-up.
          </FieldDescription>
        </FieldContent>
        <Switch
          checked={allEnabled}
          onCheckedChange={updateAllEnabled}
          aria-label="Tampilkan semua notifikasi pop-up"
        />
      </Field>

      {toastCategories.map((category) => (
        <Field key={category.category} orientation="horizontal">
          <FieldContent>
            <FieldTitle>{category.title}</FieldTitle>
            <FieldDescription>{category.description}</FieldDescription>
          </FieldContent>
          <Switch
            checked={preferences[category.category]}
            onCheckedChange={(enabled) => updateEnabled(category.category, enabled)}
            aria-label={`Tampilkan notifikasi pop-up ${category.title}`}
            disabled={!allEnabled}
          />
        </Field>
      ))}
    </AppPageCard>
  );
}
