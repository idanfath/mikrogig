import { Head, router, usePage } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';
import AppLayout from '@/layout/AppLayout';

const Home: InertiaPageWithLayout = () => {
  const auth = usePage().props.auth;
  return (
    <>
      <pre className="rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(auth, null, 2)}
      </pre>
    </>
  );
};

Home.layout = (page: ReactNode) => (
  <AppLayout title="Beranda">{page}</AppLayout>
);

export default Home;
