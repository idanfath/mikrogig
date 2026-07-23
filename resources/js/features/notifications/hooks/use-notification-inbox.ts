import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { asNotificationPageProps } from '@/features/notifications/types';
import type {
  InboxMessage,
  NotificationPageProps,
} from '@/features/notifications/types';
import app from '@/routes/app';

export function useNotificationInbox() {
  const { inbox, filters, auth } = usePage<NotificationPageProps>().props;
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [open, setOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const stored =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('notif_compact')
        : null;

    if (stored !== null) {
      return stored === 'true';
    }

    return window.matchMedia('(max-width: 767px)').matches;
  });
  const [search, setSearch] = useState(filters?.search ?? '');
  const unreadCount = auth?.unread_notifications_count ?? 0;

  const toggleCompact = () => {
    setIsCompact((prev) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('notif_compact', (!prev).toString());
      }

      return !prev;
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(filters?.search ?? '');
  }, [filters?.search]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const currentSearch = filters?.search ?? '';

      if (search !== currentSearch) {
        router.get(
          app.notifications(),
          { search: search || '' },
          {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            reset: ['inbox'],
          },
        );
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, filters?.search]);

  const openMessage = (message: InboxMessage) => {
    setSelected(message);
    setOpen(true);

    if (!message.read_at) {
      const readAt = new Date().toISOString();
      setSelected({ ...message, read_at: readAt });

      router.post(
        app.notifications.read.url({ id: message.id }),
        {},
        {
          preserveScroll: true,
          only: ['auth'],
          optimistic: (raw) => {
            const props = asNotificationPageProps(raw);

            return {
              auth: {
                ...props.auth,
                unread_notifications_count: Math.max(
                  0,
                  (props.auth?.unread_notifications_count ?? 1) - 1,
                ),
              },
              inbox: {
                ...props.inbox,
                data: props.inbox.data.map((m) =>
                  m.id === message.id ? { ...m, read_at: readAt } : m,
                ),
              },
            };
          },
        },
      );
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get('open');

    if (openId) {
      const id = parseInt(openId, 10);
      const message = inbox.data.find((m) => m.id === id);

      if (message) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        openMessage(message);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [inbox.data]);

  const deleteMessage = (id: number) => {
    router.delete(app.notifications.destroy.url({ id }), {
      preserveScroll: true,
      only: ['auth'],
      optimistic: (raw) => {
        const props = asNotificationPageProps(raw);
        const removed = props.inbox.data.find((m) => m.id === id);
        const wasUnread = removed && !removed.read_at;

        return {
          auth: {
            ...props.auth,
            unread_notifications_count: wasUnread
              ? Math.max(0, (props.auth?.unread_notifications_count ?? 1) - 1)
              : props.auth?.unread_notifications_count,
          },
          inbox: {
            ...props.inbox,
            data: props.inbox.data.filter((m) => m.id !== id),
            total: Math.max(0, props.inbox.total - 1),
          },
        };
      },
      onSuccess: () => setOpen(false),
    });
  };

  const markAllRead = () => {
    const readAt = new Date().toISOString();

    router.post(
      app.notifications.readAll.url(),
      {},
      {
        preserveScroll: true,
        only: ['auth'],
        optimistic: (raw) => {
          const props = asNotificationPageProps(raw);

          return {
            auth: {
              ...props.auth,
              unread_notifications_count: 0,
            },
            inbox: {
              ...props.inbox,
              data: props.inbox.data.map((m) => ({
                ...m,
                read_at: m.read_at ?? readAt,
              })),
            },
          };
        },
      },
    );
  };

  const closeDetail = useCallback(() => {
    setOpen(false);
    setSelected(null);
  }, []);

  return {
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
  };
}
