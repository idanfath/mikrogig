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
      page.default.layout || ((page: ReactNode) => <Layout>{page}</Layout>);

    return page;
  },
  // i commented this and added toaster to main layout instead.
  // setup({ el, App, props }) {
  //   if (!el) {
  //     // TODO: need fixing later, app works with and without this
  //     // but it throws an error in console, find a better way to handle this
  //     // i found that not having setup works, but need setup to add toaster.
  //     throw new Error('Inertia root element not found');
  //   }
  //   const root = createRoot(el);
  //   root.render(
  //     <>
  //       <Toaster position="bottom-right" reverseOrder={false} />
  //       <App {...props} />
  //     </>
  //   );
  // },
});
