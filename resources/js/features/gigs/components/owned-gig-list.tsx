import { Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { cancel } from '@/actions/App/Http/Controllers/GigController';
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
import { useConfirm } from '@/hooks/use-confirm';
import clientGigs from '@/routes/app/client/gigs';
import { create } from '@/routes/app/gigs';
import { GigStatus, getGigStatusLabel } from '@/types/enum';
import type { Gig, Paginated } from '../types';
import { GigCard } from './gig-card';
import { Pagination } from './pagination';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: GigStatus.Open, label: getGigStatusLabel(GigStatus.Open) },
  {
    value: GigStatus.InProgress,
    label: getGigStatusLabel(GigStatus.InProgress),
  },
  {
    value: GigStatus.AgreementPreparation,
    label: getGigStatusLabel(GigStatus.AgreementPreparation),
  },
  { value: GigStatus.Completed, label: getGigStatusLabel(GigStatus.Completed) },
  { value: GigStatus.Cancelled, label: getGigStatusLabel(GigStatus.Cancelled) },
  {
    value: GigStatus.DisputeResolved,
    label: getGigStatusLabel(GigStatus.DisputeResolved),
  },
];

const terminalStatuses: string[] = [
  GigStatus.Completed,
  GigStatus.Cancelled,
  GigStatus.DisputeResolved,
];

type OwnedGigListProps = {
  gigs: Paginated<Gig>;
  filters?: { search?: string; status?: string };
};

export function OwnedGigList({ gigs, filters }: OwnedGigListProps) {
  const form = useForm({});
  const [confirm, confirmDialog] = useConfirm();
  const [search, setSearch] = useState(filters?.search ?? '');
  const [status, setStatus] = useState(filters?.status ?? 'all');

  const hasActiveFilters = Boolean(status && status !== 'all');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      clientGigs.index.url({
        query: {
          ...(search ? { search } : {}),
          ...(status !== 'all' ? { status } : {}),
        },
      }),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  const activeGigs = gigs.data.filter(
    (gig) => !terminalStatuses.includes(gig.status as GigStatus),
  );
  const historyGigs = gigs.data.filter((gig) =>
    terminalStatuses.includes(gig.status as GigStatus),
  );

  const renderGigCard = (gig: Gig) => (
    <GigCard key={gig.id} gig={gig}>
      {(gig.status === GigStatus.Open ||
        gig.status === GigStatus.AgreementPreparation) && (
        <Button
          variant="destructive"
          disabled={form.processing}
          onClick={() =>
            confirm({
              title: 'Batalkan gig ini?',
              description:
                'Gig akan ditutup permanen dan tidak bisa dibuka kembali. Pelamar yang ada akan diberi tahu.',
              confirmLabel: 'Ya, batalkan gig',
              destructive: true,
              onConfirm: () => form.patch(cancel.url(gig)),
            })
          }
        >
          Batalkan
        </Button>
      )}
    </GigCard>
  );

  return (
    <AppPage
      title="Gig Saya"
      description="Kelola pekerjaan mikro yang Anda buat, pantau status pelamar, dan atur alur pengerjaan."
    >
      <div className="flex flex-col gap-4">
        <AppPageCard>
          <div className="flex flex-col gap-4">
            <form onSubmit={submit} className="w-full">
              <ListToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Cari judul atau deskripsi gig..."
                filterLabel="Filter gig"
                hasActiveFilters={hasActiveFilters}
              >
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Status Gig
                  </span>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val)}
                  >
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
                      clientGigs.index.url({
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

            <Button asChild className="w-full">
              <Link href={create()}>
                <Plus className="mr-1.5 size-4" />
                Buat Gig Baru
              </Link>
            </Button>
          </div>
        </AppPageCard>

        <div className="flex flex-col gap-6">
          {activeGigs.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
                  Gig Aktif ({activeGigs.length})
                </h2>
              </div>
              {activeGigs.map(renderGigCard)}
            </div>
          )}

          {historyGigs.length > 0 && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 font-semibold tracking-wider text-muted-foreground">
                    Riwayat / Non-Aktif ({historyGigs.length})
                  </span>
                </div>
              </div>
              {historyGigs.map(renderGigCard)}
            </div>
          )}

          {gigs.data.length === 0 && (
            <AppPageCard>Belum ada gig yang dibuat.</AppPageCard>
          )}

          <Pagination page={gigs} />
        </div>
      </div>
      {confirmDialog}
    </AppPage>
  );
}
