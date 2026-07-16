import { Head, usePage } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';
import AppLayout from '@/layout/AppLayout';

type InertiaPageWithLayout = (() => ReactElement) & {
    layout?: (page: ReactNode) => ReactNode;
};

const Home: InertiaPageWithLayout = () => {
    const auth = usePage().props.auth;
    return (
        <>
            <div className="p-6">
                <pre className="rounded bg-gray-100 p-4 text-xs">
                    {JSON.stringify(auth, null, 2)}
                </pre>
                <h1 className="text-2xl font-bold">Home Page</h1>
                <p className="mt-4">Start building your page here.</p>
            </div>
        </>
    );
};

Home.layout = (page: ReactNode) => (
    <AppLayout title="Beranda">{page}</AppLayout>
);

export default Home;
