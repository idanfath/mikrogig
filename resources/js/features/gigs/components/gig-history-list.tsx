import { router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { ListToolbar } from '@/components/ui/list-toolbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import history from '@/routes/app/history';
import {
  GigStatus,
  getGigSettlementOutcomeLabel,
  getGigStatusLabel,
} from '@/types/enum';
import type { HistoryIndexProps } from '../history-types';
import { GigHistoryCard } from './gig-history-card';
import { Pagination } from './pagination';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: GigStatus.Completed, label: getGigStatusLabel(GigStatus.Completed) },
  { value: GigStatus.Cancelled, label: getGigStatusLabel(GigStatus.Cancelled) },
  {
    value: GigStatus.DisputeResolved,
    label: getGigStatusLabel(GigStatus.DisputeResolved),
  },
];

export function GigHistoryList({ gigs, filters }: HistoryIndexProps) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [status, setStatus] = useState(filters.status ?? 'all');

  const hasActiveFilters = Boolean(status && status !== 'all');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      history.index.url({
        query: {
          ...(search ? { search } : {}),
          ...(status !== 'all' ? { status } : {}),
        },
      }),
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
        <form onSubmit={submit}>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari judul atau deskripsi riwayat..."
            filterLabel="Filter riwayat"
            hasActiveFilters={hasActiveFilters}
          >
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Status Pekerjaan
              </span>
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStatus('all');
                router.get(
                  history.index.url({
                    query: search ? { search } : {},
                  }),
                  {},
                  { preserveScroll: true, preserveState: true },
                );
              }}
            >
              Reset filter
            </Button>
          </ListToolbar>
        </form>
      </AppPageCard>

      <div className="grid gap-4">
        {gigs.data.map((gig) => (
          <GigHistoryCard key={gig.id} gig={gig} />
        ))}
      </div>

      {gigs.data.length === 0 && (
        <AppPageCard>Belum ada riwayat gig.</AppPageCard>
      )}
      <Pagination page={gigs} />
    </AppPage>
  );
}
