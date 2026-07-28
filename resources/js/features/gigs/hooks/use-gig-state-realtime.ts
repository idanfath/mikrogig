import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import { destination as gigDestination } from '@/routes/app/gigs';
import type { Auth } from '@/types/auth';
import { GigStatus } from '@/types/enum';

type GigStateChangedEvent = {
    gig_id: number;
    change:
        | 'gig'
        | 'offer'
        | 'agreement'
        | 'payment'
        | 'workflow'
        | 'dispute'
        | 'rating';
    status: GigStatus;
    occurred_at: string;
};

type RealtimePageProps = {
    auth: Auth;
    gig?: { id: number };
    dispute?: { gig_id?: number; gig?: { id: number } };
};

const listProps: Record<string, string[]> = {
    'app/client/gigs/index': ['gigs'],
    'app/applications/index': ['offers'],
    'app/history/index': ['gigs'],
    'app/admin/gig-disputes/index': ['disputes', 'server_now'],
};

const detailProps: Record<string, string[]> = {
    'app/gigs/show': [
        'gig',
        'my_offer',
        'can_apply',
        'is_owner',
        'has_current_agreement',
        'has_reached_pending_limit',
        'has_active_accepted_work',
    ],
    'app/client/gigs/applicants': ['gig', 'offers', 'pendingOffersCount'],
    'app/gigs/agreement': [
        'gig',
        'agreement',
        'is_client',
        'is_selected_freelancer',
        'capabilities',
    ],
    'app/gigs/payment': ['gig', 'payment', 'is_client', 'server_now'],
    'app/gigs/mock-payment': ['gig', 'payment', 'server_now'],
    'app/gigs/workflow': [
        'gig',
        'payment',
        'agreement',
        'participants',
        'exit_request',
        'finish_request',
        'dispute',
        'settlement',
        'server_now',
        'capabilities',
    ],
    'app/gigs/dispute': ['dispute', 'server_now', 'capabilities'],
    'app/history/show': [
        'gig',
        'counterpart',
        'agreements',
        'payments',
        'exit_requests',
        'finish_requests',
        'settlement',
        'dispute',
        'ratings',
        'terminal_at',
        'capabilities',
    ],
    'app/admin/gig-disputes/show': [
        'dispute',
        'settlement',
        'ai_overview',
        'capabilities',
        'server_now',
    ],
};

function isCurrentPhase(component: string, status: GigStatus): boolean {
    if (component === 'app/gigs/show') {
        return status === GigStatus.Open;
    }

    if (component === 'app/gigs/agreement') {
        return (
            status === GigStatus.AgreementPreparation ||
            status === GigStatus.LockPending
        );
    }

    if (
        component === 'app/gigs/payment' ||
        component === 'app/gigs/mock-payment'
    ) {
        return status === GigStatus.PaymentPending;
    }

    if (component === 'app/gigs/workflow') {
        return (
            status === GigStatus.Locked ||
            status === GigStatus.InProgress ||
            status === GigStatus.Review
        );
    }

    if (component === 'app/gigs/dispute') {
        return status === GigStatus.Disputed;
    }

    return true;
}

function pageGigId(component: string, props: RealtimePageProps): number | null {
    if (
        component === 'app/gigs/dispute' ||
        component === 'app/admin/gig-disputes/show'
    ) {
        return props.dispute?.gig_id ?? props.dispute?.gig?.id ?? null;
    }

    return props.gig?.id ?? null;
}

export function useGigStateRealtime(): void {
    const page = usePage<RealtimePageProps>();
    const component = page.component;
    const userId = page.props.auth.user.id;
    const gigId = pageGigId(component, page.props);

    useEffect(() => {
        let reloadTimer: ReturnType<typeof setTimeout> | null = null;
        let pendingEvent: GigStateChangedEvent | null = null;
        let didConnect = false;
        const channel = window.Echo.private(`App.Models.User.${userId}`);
        const reload = (only: string[]): void => {
            router.reload({
                only,
                preserveErrors: true,
            });
        };
        const visitDestination = (targetGigId: number): void => {
            router.visit(gigDestination(targetGigId), {
                preserveScroll: true,
            });
        };
        const handleEvent = (event: GigStateChangedEvent): void => {
            const listOnly = listProps[component];

            if (listOnly) {
                if (
                    component !== 'app/admin/gig-disputes/index' ||
                    event.change === 'dispute'
                ) {
                    reload(listOnly);
                }

                return;
            }

            const detailOnly = detailProps[component];

            if (!detailOnly || gigId !== event.gig_id) {
                return;
            }

            const staysOnPage =
                component === 'app/client/gigs/applicants' ||
                component === 'app/history/show' ||
                component === 'app/admin/gig-disputes/show' ||
                isCurrentPhase(component, event.status);

            if (staysOnPage) {
                reload(detailOnly);

                return;
            }

            visitDestination(event.gig_id);
        };
        const onChanged = (event: GigStateChangedEvent): void => {
            const listOnly = listProps[component];
            const isRelevantListEvent =
                listOnly !== undefined &&
                (component !== 'app/admin/gig-disputes/index' ||
                    event.change === 'dispute');
            const isRelevantDetailEvent =
                detailProps[component] !== undefined && gigId === event.gig_id;

            if (!isRelevantListEvent && !isRelevantDetailEvent) {
                return;
            }

            pendingEvent = event;

            if (reloadTimer !== null) {
                clearTimeout(reloadTimer);
            }

            reloadTimer = setTimeout(() => {
                if (pendingEvent) {
                    handleEvent(pendingEvent);
                }
            }, 150);
        };
        const onConnected = (): void => {
            if (!didConnect) {
                didConnect = true;

                return;
            }

            const listOnly = listProps[component];

            if (listOnly) {
                reload(listOnly);

                return;
            }

            const detailOnly = detailProps[component];

            if (!detailOnly || gigId === null) {
                return;
            }

            if (
                component === 'app/client/gigs/applicants' ||
                component === 'app/history/show' ||
                component === 'app/admin/gig-disputes/show'
            ) {
                reload(detailOnly);

                return;
            }

            visitDestination(gigId);
        };

        channel.listen('.gig.state.changed', onChanged);
        window.Echo.connector.pusher.connection.bind('connected', onConnected);

        return () => {
            if (reloadTimer !== null) {
                clearTimeout(reloadTimer);
            }

            channel.stopListening('.gig.state.changed');
            window.Echo.connector.pusher.connection.unbind(
                'connected',
                onConnected,
            );
        };
    }, [component, gigId, userId]);
}
