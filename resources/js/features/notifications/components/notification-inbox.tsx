import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { AppPage } from '@/components/layout/app-page';
import { ListToolbar } from '@/components/ui/list-toolbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotificationInbox } from '@/features/notifications/hooks/use-notification-inbox';
import { useMediaQuery } from '@/hooks/use-media-query';
import app from '@/routes/app';
import { NotificationCategory } from '@/types/enum';
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
    filterByCategory,
    unreadCount,
    toggleCompact,
    openMessage,
    deleteMessage,
    markAllRead,
  } = useNotificationInbox();
  const filtersSearch = filters?.search ?? undefined;
  const filtersCategory = filters?.category ?? undefined;

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
          query: {
            ...(filtersSearch ? { search: filtersSearch } : {}),
            ...(filtersCategory ? { category: filtersCategory } : {}),
          },
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
  }, [isDesktop, filtersSearch, filtersCategory, closeDetail]);

  return (
    <AppPage
      title="Notifikasi"
      description="Kotak masuk dan riwayat notifikasi terbaru Anda."
      className="max-w-4xl"
    >
      <div className="w-full">
        <div className="mb-4 flex flex-col gap-4">
          <NotificationToolbar
            inbox={inbox}
            isDesktop={isDesktop}
            isCompact={isCompact}
            unreadCount={unreadCount}
            onToggleCompact={toggleCompact}
            onMarkAllRead={markAllRead}
          />

          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari notifikasi..."
            filterLabel="Filter notifikasi"
            hasActiveFilters={Boolean(filtersCategory)}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground">Jenis Notifikasi</span>
              <Select
                value={filtersCategory ?? 'all'}
                onValueChange={(value) =>
                  filterByCategory(value === 'all' ? '' : (value as NotificationCategory))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua notifikasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua notifikasi</SelectItem>
                  <SelectItem value={NotificationCategory.Chat}>Pesan</SelectItem>
                  <SelectItem value={NotificationCategory.System}>Aktivitas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ListToolbar>
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
    </AppPage>
  );
}
