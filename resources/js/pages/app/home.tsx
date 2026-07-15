import { Head } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';
import AppLayout from '@/layout/AppLayout';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const Home: InertiaPageWithLayout = () => {
  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Home Page</h1>
        <p className="mt-4">Start building your page here.</p>
      </div>
    </>
  );
}

Home.layout = (page: ReactNode) =>
  <AppLayout title='Beranda'>{page}</AppLayout>;

export default Home;
