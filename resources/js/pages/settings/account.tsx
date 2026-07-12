import { Head } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const Profile: InertiaPageWithLayout = () => {
  return (
    <>
      <Head title="Profile" />
      <div className="p-6">
        <h1 className="text-2xl font-bold">Profile Page</h1>
        <p className="mt-4">Start building your page here.</p>
      </div>
    </>
  );
}

export default Profile;
