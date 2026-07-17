import { Head, Link, usePage, router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import toast, { useToasterStore } from 'react-hot-toast';

import { Logo } from '@/components/brand/logo';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileBottomNavigation } from '@/components/layout/mobile-bottom-navigation';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { showNotificationToast } from '@/lib/notificationToast';
import { cn } from '@/lib/utils';
import app from '@/routes/app';

import Layout from './Layout';

type AppLayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function AppLayout({ title, children }: AppLayoutProps) {
  const { auth } = usePage<any>().props;
  const { url } = usePage();
  const user = auth?.user;
  const unreadCount = auth?.unread_notifications_count ?? 0;
  const isNotifPage = url.split('?')[0] === app.notifications().url;
  const { toasts } = useToasterStore();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const limit = isMobile ? 1 : 3;

    const visibleToasts = toasts.filter((t) => t.visible);

    if (visibleToasts.length > limit) {
      const toastsToDismiss = visibleToasts.slice(
        0,
        visibleToasts.length - limit,
      );
      toastsToDismiss.forEach((t) => toast.dismiss(t.id));
    }
  }, [toasts]);

  useEffect(() => {
    const userId = user?.id;

    if (!userId) {
      return;
    }

    window.Echo.private(`App.Models.User.${userId}`).listen(
      '.notification.received',
      (e: any) => {
        showNotificationToast(e);

        const notifPath = app.notifications.url().split('?')[0];
        const onNotifPage = window.location.pathname === notifPath;

        if (onNotifPage) {
          router.reload({ only: ['inbox', 'auth'], reset: ['inbox'] });
        } else {
          router.reload({ only: ['auth'] });
        }
      },
    );

    return () => {
      window.Echo.leaveChannel(`App.Models.User.${userId}`);
    };
  }, [user?.id]);

  return (
    <Layout>
      {title && <Head title={title} />}
      <TooltipProvider>
        <SidebarProvider className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
            <SidebarTrigger className="hidden md:inline-flex" />
            <Logo aria-label="MikroGig, Beranda" imageClassName="h-7" />
            {title && (
              <h1 className="select-none hidden text-sm font-semibold text-foreground md:block">
                {title}
              </h1>
            )}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                'relative ml-auto',
                isNotifPage && 'bg-accent text-accent-foreground',
              )}
            >
              <Link
                href={app.notifications()}
                aria-label="Notifikasi"
                title="Notifikasi"
                className="relative flex items-center justify-center"
              >
                <Bell className="size-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    key={unreadCount}
                    className="absolute -top-1 -right-1 flex h-4 min-w-4 animate-badge-pop items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background"
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          </header>
          <div className="flex min-h-0 flex-1">
            <AppSidebar className="md:top-14 md:h-[calc(100svh-3.5rem)] select-none" />
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
