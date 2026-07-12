import { Head, usePage } from '@inertiajs/react';
import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import Layout from './Layout';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <Layout>
      <main>{children}</main>
    </Layout>
  );
}
