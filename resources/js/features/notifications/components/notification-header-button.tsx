import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuthProps } from '@/features/notifications/types';
import { cn } from '@/lib/utils';
import app from '@/routes/app';

export function NotificationHeaderButton() {
  const { url, props } = usePage<{ auth?: AuthProps }>();
  const unreadCount = props.auth?.unread_notifications_count ?? 0;
  const isNotificationsPage = url.split('?')[0] === app.notifications().url;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        'relative ml-auto',
        isNotificationsPage && 'bg-accent text-accent-foreground',
      )}
    >
      <Link
        href={app.notifications()}
        aria-label="Notifikasi"
        title="Notifikasi"
        className="relative flex items-center justify-center"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            key={unreadCount}
            className="absolute -top-1 -right-1 flex h-4 min-w-4 animate-badge-pop items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background"
          >
            {unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
