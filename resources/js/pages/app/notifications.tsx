import type { ReactNode } from 'react';
import { NotificationInbox } from '@/features/notifications/components/notification-inbox';
import AppLayout from '@/layout/AppLayout';

const Notifications: InertiaPageWithLayout = () => {
  return <NotificationInbox />;
};

Notifications.layout = (page: ReactNode) => (
  <AppLayout title="Notifikasi">{page}</AppLayout>
);

export default Notifications;
