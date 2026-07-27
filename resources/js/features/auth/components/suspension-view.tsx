import { Link, router } from '@inertiajs/react';
import { Bell, LogOut, Settings, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import { getServerCountdown } from '@/lib/server-time';
import { logout } from '@/routes';
import app from '@/routes/app';
import {
    getGigDisputeFindingLabel,
    getGigDisputeTypeLabel,
    getGigExitExecutionModeLabel,
    getGigExitTypeLabel,
    getGigSettlementOutcomeLabel,
} from '@/types/enum';

type SuspensionProps = {
    ban: {
        reason: string | null;
        banned_at: string;
        banned_until: string | null;
        is_permanent: boolean;
        offense: {
            sequence: number;
            duration_days: number;
            gig: { id: number; title: string };
            source: {
                kind: 'dispute' | 'exit_request';
                type: string;
                status: string;
                finding: string | null;
                execution_mode: string | null;
                resolution_note: string | null;
            } | null;
            resolution: {
                outcome: string;
                total_amount: number;
                freelancer_payout: number;
                client_refund: number;
            } | null;
        } | null;
    };
    server_now: string;
};

function SuspensionView({ ban, server_now: serverNow }: SuspensionProps) {
    const [clock, setClock] = useState(() => Date.now());
    const [clientStartedAt] = useState(() => Date.now());
    const serverOffset = useMemo(
        () => new Date(serverNow).getTime() - clientStartedAt,
        [clientStartedAt, serverNow],
    );
    const currentServerTime = new Date(clock + serverOffset).toISOString();
    const offense = ban.offense;

    useEffect(() => {
        const timer = window.setInterval(() => setClock(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!ban.banned_until) {
            return;
        }

        const offset = new Date(serverNow).getTime() - Date.now();
        const delay =
            new Date(ban.banned_until).getTime() - (Date.now() + offset) + 50;
        const timer = window.setTimeout(
            () => router.reload({ only: ['ban', 'server_now'] }),
            Math.max(0, delay),
        );

        return () => window.clearTimeout(timer);
    }, [ban.banned_until, serverNow]);

    return (
        <AppPage
            title="Akun ditangguhkan"
            description="Akses fitur bisnis dihentikan. Pengaturan akun dan notifikasi tetap tersedia."
        >
            <AppPageCard className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge variant="destructive">
                        {ban.is_permanent ? 'Permanen' : 'Sementara'}
                    </Badge>
                    {!ban.is_permanent && ban.banned_until && (
                        <span className="text-sm font-medium text-destructive">
                            Tersisa {getServerCountdown(ban.banned_until, currentServerTime)}
                        </span>
                    )}
                </div>

                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                        <dt className="text-muted-foreground">Alasan</dt>
                        <dd>{ban.reason || 'Tidak ada alasan yang dicantumkan.'}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                        <dt className="text-muted-foreground">Mulai</dt>
                        <dd>{formatDate(ban.banned_at, 'dd MMMM yyyy · HH:mm')}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                        <dt className="text-muted-foreground">Berakhir</dt>
                        <dd>
                            {ban.banned_until
                                ? formatDate(ban.banned_until, 'dd MMMM yyyy · HH:mm')
                                : 'Tidak terbatas'}
                        </dd>
                    </div>
                </dl>
            </AppPageCard>

            {offense && (
                <AppPageCard className="flex flex-col gap-4">
                    <div>
                        <h2 className="font-semibold">
                            Pelanggaran ke-{offense.sequence}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Durasi {offense.duration_days} hari · {offense.gig.title}
                        </p>
                    </div>

                    {offense.source && (
                        <div className="text-sm">
                            <p>
                                Sumber:{' '}
                                {offense.source.kind === 'dispute'
                                    ? getGigDisputeTypeLabel(offense.source.type)
                                    : getGigExitTypeLabel(offense.source.type)}
                            </p>
                            {offense.source.finding && (
                                <p>
                                    Temuan: {getGigDisputeFindingLabel(offense.source.finding)}
                                </p>
                            )}
                            {offense.source.execution_mode && (
                                <p>
                                    Eksekusi:{' '}
                                    {getGigExitExecutionModeLabel(offense.source.execution_mode)}
                                </p>
                            )}
                            {offense.source.resolution_note && (
                                <p>Ringkasan: {offense.source.resolution_note}</p>
                            )}
                        </div>
                    )}

                    {offense.resolution && (
                        <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                            <p className="font-medium">
                                {getGigSettlementOutcomeLabel(offense.resolution.outcome)}
                            </p>
                            <p className="text-muted-foreground">
                                Payout pekerja Rp
                                {offense.resolution.freelancer_payout.toLocaleString('id-ID')} ·
                                Refund klien Rp
                                {offense.resolution.client_refund.toLocaleString('id-ID')}
                            </p>
                        </div>
                    )}
                </AppPageCard>
            )}

            <Button asChild variant="destructive">
                <Link href={logout()} method="post">
                    <LogOut aria-hidden="true" />
                    Keluar
                </Link>
            </Button>
        </AppPage>
    );
}

export { SuspensionView };
export type { SuspensionProps };
