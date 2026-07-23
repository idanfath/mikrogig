import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useNotificationInbox } from '@/features/notifications/hooks/use-notification-inbox';
import { useMediaQuery } from '@/hooks/use-media-query';
import app from '@/routes/app';
import { NotificationDetailPanel } from './notification-detail-panel';
import { NotificationList } from './notification-list';
import { NotificationPagination } from './notification-pagination';
import { NotificationToolbar } from './notification-toolbar';

const BREAKPOINT_CROSS_DEBOUNCE_MS = 250;

export function NotificationInbox() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const previousDesktop = useRef<boolean | null>(null);
  const {
    inbox,
    filters,
    selected,
    open,
    setOpen,
    closeDetail,
    isCompact,
    search,
    setSearch,
    unreadCount,
    toggleCompact,
    openMessage,
    deleteMessage,
    markAllRead,
  } = useNotificationInbox();
  const filtersSearch = filters?.search ?? undefined;

  useEffect(() => {
    if (previousDesktop.current === null) {
      previousDesktop.current = isDesktop;

      return;
    }

    if (previousDesktop.current === isDesktop) {
      return;
    }

    const timer = window.setTimeout(() => {
      previousDesktop.current = isDesktop;
      closeDetail();

      router.get(
        app.notifications.url({
          query: filtersSearch ? { search: filtersSearch } : {},
        }),
        {},
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
          only: ['inbox', 'auth'],
          reset: ['inbox'],
        },
      );
    }, BREAKPOINT_CROSS_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [isDesktop, filtersSearch, closeDetail]);

  return (
    <div className="w-full max-w-4xl px-4">
      <div className="mb-4 flex flex-col gap-4">
        <NotificationToolbar
          inbox={inbox}
          isDesktop={isDesktop}
          isCompact={isCompact}
          unreadCount={unreadCount}
          onToggleCompact={toggleCompact}
          onMarkAllRead={markAllRead}
        />

        <InputGroup mobileLarge>
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Cari notifikasi..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            mobileLarge
          />
        </InputGroup>
      </div>
      <NotificationList
        inbox={inbox}
        isCompact={isCompact}
        isDesktop={isDesktop}
        hasSearch={Boolean(filters?.search)}
        onOpen={openMessage}
        onDelete={deleteMessage}
      />

      {isDesktop && <NotificationPagination inbox={inbox} />}
      <NotificationDetailPanel
        open={open}
        onOpenChange={setOpen}
        selected={selected}
        isDesktop={isDesktop}
        onDelete={deleteMessage}
      />
    </div>
  );
}
