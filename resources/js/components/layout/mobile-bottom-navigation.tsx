import { Link, usePage } from '@inertiajs/react';

import { appNavigation, mobileAppNavigation } from '@/components/layout/app-navigation';
import { cn } from '@/lib/utils';

function MobileBottomNavigation() {
  const { url } = usePage();
  const currentPath = url.split('?')[0];

  return (
    <nav
      aria-label="Navigasi aplikasi"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md">
        {mobileAppNavigation?.items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href.url;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-lg',
                  isActive && 'bg-accent text-accent-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { MobileBottomNavigation };
