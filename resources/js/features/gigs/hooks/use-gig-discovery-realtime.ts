import { router } from '@inertiajs/react';
import { useEffect } from 'react';

import type { Gig, Paginated } from '../types';

type GigDiscoveryChangedEvent = {
    gig_id: number;
    change: 'upsert' | 'remove' | 'applicant_count';
    discoverable: boolean;
    pending_applicants_count?: number | null;
    occurred_at: string;
};

export function useGigDiscoveryRealtime(): void {
    useEffect(() => {
        let reloadTimer: ReturnType<typeof setTimeout> | null = null;
        const channel = window.Echo.private('gigs.discovery');
        const reloadGigs = (): void => {
            if (reloadTimer !== null) {
                clearTimeout(reloadTimer);
            }

            reloadTimer = setTimeout(() => {
                router.reload({ only: ['gigs'] });
            }, 150);
        };
        const onChanged = (event: GigDiscoveryChangedEvent): void => {
            if (event.change === 'applicant_count') {
                router.replaceProp(
                    'gigs',
                    (gigs: Paginated<Gig>): Paginated<Gig> => ({
                        ...gigs,
                        data: gigs.data.map((gig) =>
                            gig.id === event.gig_id
                                ? {
                                      ...gig,
                                      pending_applicants_count:
                                          event.pending_applicants_count ?? 0,
                                  }
                                : gig,
                        ),
                    }),
                );

                return;
            }

            if (event.change === 'remove' || !event.discoverable) {
                router.replaceProp(
                    'gigs',
                    (gigs: Paginated<Gig>): Paginated<Gig> => ({
                        ...gigs,
                        data: gigs.data.filter(
                            (gig) => gig.id !== event.gig_id,
                        ),
                    }),
                );
            }

            reloadGigs();
        };

        channel.listen('.gig.discovery.changed', onChanged);
        window.Echo.connector.pusher.connection.bind('connected', reloadGigs);

        return () => {
            if (reloadTimer !== null) {
                clearTimeout(reloadTimer);
            }

            channel.stopListening('.gig.discovery.changed');
            window.Echo.connector.pusher.connection.unbind(
                'connected',
                reloadGigs,
            );
            window.Echo.leave('gigs.discovery');
        };
    }, []);
}
