import { Head, router, usePage } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';
import AppLayout from '@/layout/AppLayout';

const Home: InertiaPageWithLayout = () => {
  const auth = usePage().props.auth;
  return (
    <>
    </>
  );
};

Home.layout = (page: ReactNode) => (
  <AppLayout title="Beranda">{page}</AppLayout>
);

export default Home;
