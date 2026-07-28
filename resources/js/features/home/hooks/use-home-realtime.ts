import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import type { Auth } from '@/types/auth';

export function useHomeRealtime(): void {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userId = auth.user.id;

    useEffect(() => {
        let reloadTimer: ReturnType<typeof setTimeout> | null = null;
        const channelName = `App.Models.User.${userId}`;
        const channel = window.Echo.private(channelName);
        const reloadHome = (): void => {
            if (reloadTimer !== null) {
                clearTimeout(reloadTimer);
            }

            reloadTimer = setTimeout(() => {
                router.reload({ only: ['home'] });
            }, 150);
        };
        const reconnect = (): void => {
            router.reload({ only: ['home', 'chat_notices'] });
        };

        channel.listen('.gig.state.changed', reloadHome);
        window.Echo.connector.pusher.connection.bind('connected', reconnect);

        return () => {
            if (reloadTimer !== null) {
                clearTimeout(reloadTimer);
            }

            channel.stopListening('.gig.state.changed');
            window.Echo.connector.pusher.connection.unbind(
                'connected',
                reconnect,
            );
        };
    }, [userId]);
}
