import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AppPage } from '@/components/layout/app-page';
import { NotificationToastPreference } from '@/features/notifications/components/notification-toast-preference';
import { AccountSettingsForm } from '@/features/profile/components/account-settings-form';
import AppLayout from '@/layout/AppLayout';

type Props = {
  hasPassword: boolean;
};

const AccountPage: InertiaPageWithLayout<Props> = ({ hasPassword }) => {
  return (
    <>
      <Head title="Pengaturan Akun" />
      <AppPage
        title="Pengaturan Akun"
        description="Kelola pengaturan keamanan akun Anda dan amankan akses masuk aplikasi."
      >
        <div className="flex flex-col gap-6">
          <AccountSettingsForm hasPassword={hasPassword} />
          <NotificationToastPreference />
        </div>
      </AppPage>
    </>
  );
};

AccountPage.layout = (page: ReactNode) => (
  <AppLayout title="Akun">{page}</AppLayout>
);

export default AccountPage;
