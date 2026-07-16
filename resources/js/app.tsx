import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
import './echo';
import Layout from './layout/Layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', {
            eager: true,
        }) as Record<string, any>;
        const page = pages[`./pages/${name}.tsx`];
        // kalau gapunya layout, pake MasterLayout
        // any page that uses a layout must explicitly set
        // MasterLayout as it's layout's layout, otherwise it wont be wrapped by MasterLayout
        page.default.layout =
            page.default.layout ||
            ((page: ReactNode) => <Layout>{page}</Layout>);

        return page;
    },
});
