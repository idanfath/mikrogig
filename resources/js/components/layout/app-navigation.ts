import { House, Settings, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import app from '@/routes/app';
import type { RouteDefinition } from '@/wayfinder';

export type AppNavigationItem = {
  label: string;
  icon: LucideIcon;
  href: RouteDefinition<'get'>;
};

export type AppNavigationCategory = {
  id: 'application' | 'account';
  label: string;
  items: AppNavigationItem[];
};

export const appNavigation: AppNavigationCategory[] = [
  {
    id: 'application',
    label: 'Aplikasi',
    items: [
      {
        label: 'Beranda',
        icon: House,
        href: app.home(),
      },
    ],
  },
  {
    id: 'account',
    label: 'Akun',
    items: [
      {
        label: 'Profil',
        icon: UserRound,
        href: app.profile(),
      },
      {
        label: 'Pengaturan',
        icon: Settings,
        href: app.account(),
      },
    ],
  },
];
