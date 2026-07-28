import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import app from '@/routes/app';
import type { User } from '@/types/auth';

type AccountStateChangedEvent = {
    state: 'active' | 'suspended';
    occurred_at: string;
};

type AccountPageProps = {
    auth?: {
        user?: User | null;
    };
};

export function useAccountRealtime(): void {
    const { auth } = usePage<AccountPageProps>().props;
    const user = auth?.user;
    const userId = user?.id;
    const isBanned = user?.is_banned;

    useEffect(() => {
        if (!userId || isBanned === undefined) {
            return;
        }

        let didConnect = false;
        const suspensionPath = app.suspension.url();
        const channel = window.Echo.private(`App.Models.User.${userId}`);
        const reconcileRoute = (banned: boolean): void => {
            if (banned && window.location.pathname !== suspensionPath) {
                router.visit(app.suspension());
            } else if (!banned && window.location.pathname === suspensionPath) {
                router.visit(app.home());
            }
        };
        const onChanged = (event: AccountStateChangedEvent): void => {
            if (event.state === 'suspended') {
                router.visit(app.suspension());

                return;
            }

            if (window.location.pathname === suspensionPath) {
                router.visit(app.home());

                return;
            }

            router.reload({ only: ['auth'], preserveErrors: true });
        };
        const onConnected = (): void => {
            if (!didConnect) {
                didConnect = true;

                return;
            }

            router.reload({
                only: ['auth'],
                preserveErrors: true,
                onSuccess: (page) => {
                    const nextUser = (page.props as AccountPageProps).auth
                        ?.user;

                    if (nextUser) {
                        reconcileRoute(nextUser.is_banned);
                    }
                },
            });
        };

        reconcileRoute(isBanned);
        channel.listen('.account.state.changed', onChanged);
        window.Echo.connector.pusher.connection.bind('connected', onConnected);

        return () => {
            channel.stopListening('.account.state.changed');
            window.Echo.connector.pusher.connection.unbind(
                'connected',
                onConnected,
            );
        };
    }, [isBanned, userId]);
}
