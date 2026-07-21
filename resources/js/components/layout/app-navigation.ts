import { House, Settings, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import app from '@/routes/app';
import type { RouteDefinition } from '@/wayfinder';
import { UserRole } from '@/types';

export type AppNavigationItem = {
  label: string;
  icon: LucideIcon;
  href: RouteDefinition<'get'>;
  allowedRoles?: UserRole[];
  avatar?: boolean;
};

export type AppNavigationCategory = {
  id: 'application' | 'account' | string;
  hidden?: boolean;
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

export const mobileAppNavigation: AppNavigationCategory = {
  id: 'mobile',
  label: 'Navigasi',
  items: [
    {
      label: 'Beranda',
      icon: House,
      href: app.home(),
    },
    {
      label: 'Akun',
      icon: UserRound,
      href: app.user(),
      avatar: true,
    },
  ],
};

export function isNavItemAllowed(
  item: AppNavigationItem,
  role?: UserRole | null,
): boolean {
  if (!item.allowedRoles?.length) {
    return true;
  }

  if (!role) {
    return false;
  }

  return item.allowedRoles.includes(role);
}

export function filterNavItems(
  items: AppNavigationItem[],
  role?: UserRole | null,
): AppNavigationItem[] {
  return items.filter((item) => isNavItemAllowed(item, role));
}

export function filterNavCategories(
  categories: AppNavigationCategory[],
  role?: UserRole | null,
): AppNavigationCategory[] {
  return categories
    .map((category) => ({
      ...category,
      items: filterNavItems(category.items, role),
    }))
    .filter((category) => category.items.length > 0);
}
