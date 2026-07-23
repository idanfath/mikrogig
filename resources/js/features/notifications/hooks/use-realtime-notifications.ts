import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import toast, { useToasterStore } from 'react-hot-toast';
import { showNotificationToast } from '@/features/notifications/lib/notification-toast';
import type {
  AuthProps,
  NotificationReceivedEvent,
} from '@/features/notifications/types';
import app from '@/routes/app';

export function useRealtimeNotifications() {
  const { auth } = usePage<{ auth?: AuthProps }>().props;
  const { toasts } = useToasterStore();
  const userId = auth?.user?.id;

  useEffect(() => {
    const limit = window.innerWidth < 768 ? 1 : 3;
    const visibleToasts = toasts.filter((toastItem) => toastItem.visible);

    if (visibleToasts.length > limit) {
      visibleToasts
        .slice(0, visibleToasts.length - limit)
        .forEach((toastItem) => toast.dismiss(toastItem.id));
    }
  }, [toasts]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    window.Echo.private(`App.Models.User.${userId}`).listen(
      '.notification.received',
      (event: NotificationReceivedEvent) => {
        showNotificationToast(event);

        const notificationPath = app.notifications.url().split('?')[0];
        const onNotificationsPage =
          window.location.pathname === notificationPath;

        if (onNotificationsPage) {
          router.reload({ only: ['inbox', 'auth'], reset: ['inbox'] });

          return;
        }

        router.reload({ only: ['auth'] });
      },
    );

    return () => {
      window.Echo.leaveChannel(`App.Models.User.${userId}`);
    };
  }, [userId]);
}
