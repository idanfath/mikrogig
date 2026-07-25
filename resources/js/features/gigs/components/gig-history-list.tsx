import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import history from '@/routes/app/history';
import {
  GigStatus,
  getGigSettlementOutcomeLabel,
  getGigStatusLabel,
} from '@/types/enum';
import type { HistoryIndexProps } from '../history-types';
import { Pagination } from './pagination';

const statusOptions = [
  { value: 'all', label: 'Semua' },
  { value: GigStatus.Completed, label: getGigStatusLabel(GigStatus.Completed) },
  { value: GigStatus.Cancelled, label: getGigStatusLabel(GigStatus.Cancelled) },
  {
    value: GigStatus.DisputeResolved,
    label: getGigStatusLabel(GigStatus.DisputeResolved),
  },
];

export function GigHistoryList({ gigs, filters }: HistoryIndexProps) {
  const [status, setStatus] = useState(filters.status);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      history.index.url({ query: { status } }),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  return (
    <AppPage
      title="Riwayat Gig"
      description="Gig yang sudah selesai, dibatalkan, atau sengketanya diselesaikan."
    >
      <AppPageCard>
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-9 rounded-md border bg-background px-2"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Terapkan</Button>
        </form>
      </AppPageCard>

      <div className="grid gap-4">
        {gigs.data.map((gig) => (
          <AppPageCard key={gig.id} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{gig.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {gig.counterpart
                    ? `Dengan ${gig.counterpart.name}`
                    : 'Belum ada freelancer terpilih'}
                </p>
              </div>
              <Badge variant="secondary">{getGigStatusLabel(gig.status)}</Badge>
            </div>
            {gig.terminal_at && (
              <p className="text-sm text-muted-foreground">
                Final:{' '}
                {new Intl.DateTimeFormat('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(gig.terminal_at))}
              </p>
            )}
            {gig.settlement && (
              <p className="text-sm">
                {getGigSettlementOutcomeLabel(gig.settlement.outcome)} · Pekerja
                Rp{gig.settlement.freelancer_payout.toLocaleString('id-ID')} ·
                Klien Rp{gig.settlement.client_refund.toLocaleString('id-ID')}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Rating Anda: {gig.viewer_has_rated ? 'sudah dikirim' : 'belum'} ·
              Rating lawan:{' '}
              {gig.counterpart_has_rated ? 'sudah dikirim' : 'belum'}
            </p>
            <Button asChild variant="outline" className="self-start">
              <Link href={history.show(gig.id)}>Lihat riwayat</Link>
            </Button>
          </AppPageCard>
        ))}
      </div>

      {gigs.data.length === 0 && (
        <AppPageCard>Belum ada riwayat gig.</AppPageCard>
      )}
      <Pagination page={gigs} />
    </AppPage>
  );
}
