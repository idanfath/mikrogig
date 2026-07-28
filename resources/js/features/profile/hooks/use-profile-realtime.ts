import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import type { Auth } from '@/types/auth';

type GigStateChangedEvent = {
    change: string;
};

export function useProfileRealtime(): void {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userId = auth.user.id;

    useEffect(() => {
        let didConnect = false;
        const channel = window.Echo.private(`App.Models.User.${userId}`);
        const reloadProfile = (): void => {
            router.reload({
                only: ['profile'],
                preserveErrors: true,
            });
        };
        const onChanged = (event: GigStateChangedEvent): void => {
            if (event.change === 'rating') {
                reloadProfile();
            }
        };
        const onConnected = (): void => {
            if (didConnect) {
                reloadProfile();
            }

            didConnect = true;
        };

        channel.listen('.gig.state.changed', onChanged);
        window.Echo.connector.pusher.connection.bind('connected', onConnected);

        return () => {
            channel.stopListening('.gig.state.changed');
            window.Echo.connector.pusher.connection.unbind(
                'connected',
                onConnected,
            );
        };
    }, [userId]);
}
