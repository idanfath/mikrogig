import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { ProfilePage } from '@/features/profile/components/profile-page';
import type { ProfilePageProps } from '@/features/profile/types';
import AppLayout from '@/layout/AppLayout';

const Profile: InertiaPageWithLayout<ProfilePageProps> = (props) => {
  return (
    <>
      <Head title="Profil" />
      <ProfilePage {...props} />
    </>
  );
};

Profile.layout = (page: ReactNode) => (
  <AppLayout title="Profil">{page}</AppLayout>
);

export default Profile;
