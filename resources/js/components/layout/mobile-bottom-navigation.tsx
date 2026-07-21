import { Link, usePage } from '@inertiajs/react';

import {
  filterNavItems,
  mobileAppNavigation,
} from '@/components/layout/app-navigation';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types/auth';

function MobileBottomNavigation() {
  const {
    url,
    props: { auth },
  } = usePage<{ auth: Auth }>();
  const currentPath = url.split('?')[0];
  const user = auth.user;
  const items = filterNavItems(mobileAppNavigation.items, user?.role);

  return (
    <nav
      aria-label="Navigasi aplikasi"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex h-14 max-w-md">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href.url;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-lg',
                  isActive && 'bg-accent text-accent-foreground',
                )}
              >
                {item.avatar ? (
                  <UserAvatar user={user} size="sm" className="size-7" />
                ) : (
                  <Icon className="size-5" aria-hidden="true" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { MobileBottomNavigation };
