import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { Logo } from '@/components/brand/logo';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileBottomNavigation } from '@/components/layout/mobile-bottom-navigation';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NotificationHeaderButton } from '@/features/notifications/components/notification-header-button';
import { useRealtimeNotifications } from '@/features/notifications/hooks/use-realtime-notifications';

import Layout from './Layout';

type AppLayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function AppLayout({ title, children }: AppLayoutProps) {
  useRealtimeNotifications();

  return (
    <Layout>
      {title && <Head title={title} />}
      <TooltipProvider>
        <SidebarProvider className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
            <SidebarTrigger className="hidden md:inline-flex" />
            <Logo aria-label="MikroGig, Beranda" imageClassName="h-7" />
            {title && (
              <h1 className="hidden text-sm font-semibold text-foreground select-none md:block">
                {title}
              </h1>
            )}
            <NotificationHeaderButton />
          </header>
          <div className="flex min-h-0 flex-1">
            <AppSidebar className="select-none md:top-14 md:h-[calc(100svh-3.5rem)]" />
            <div className="flex min-w-0 flex-1 flex-col bg-background">
              <main
                id="konten-utama"
                className="flex min-h-0 flex-1 flex-col items-center py-6 pb-[calc(4rem+env(safe-area-inset-bottom))] md:py-8 md:pb-8"
              >
                {children}
              </main>
            </div>
          </div>
          <MobileBottomNavigation />
        </SidebarProvider>
      </TooltipProvider>
    </Layout>
  );
}
