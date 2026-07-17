import type { PropsWithChildren } from 'react';
import { Logo } from '@/components/brand/logo';
import Layout from './Layout';

export default function StatusLayout({ children }: PropsWithChildren) {
  return (
    <Layout>
      <main className="flex min-h-dvh flex-col bg-background p-5 sm:items-center sm:justify-center sm:p-6">
        <div className="flex w-full max-w-md flex-1 flex-col gap-6 sm:flex-none">
          <Logo className="shrink-0" />
          {children}
        </div>
      </main>
    </Layout>
  );
}
