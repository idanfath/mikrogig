import { Head, usePage, router } from '@inertiajs/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Layout from './Layout';
import { showNotificationToast } from '@/lib/notificationToast';
import toast, { useToasterStore } from 'react-hot-toast';

type AppLayoutProps = {
    title?: string;
    children: ReactNode;
};

export default function AppLayout({ title, children }: AppLayoutProps) {
    const { auth } = usePage<any>().props;
    const user = auth?.user;
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
        if (!user) return;

        const channel = window.Echo.private(
            `App.Models.User.${user.id}`,
        ).listen('.notification.received', (e: any) => {
            showNotificationToast(e);
            router.reload({ only: ['inbox'] });
        });

        return () => {
            window.Echo.leaveChannel(`App.Models.User.${user.id}`);
        };
    }, [user?.id]);

    return (
        <Layout>
            {title && <Head title={title} />}
            <main className="flex min-h-screen flex-col items-center py-10">
                {children}
            </main>
        </Layout>
    );
}
