import { router, useForm } from '@inertiajs/react';
import { FileSearch } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { withdraw } from '@/actions/App/Http/Controllers/GigOfferController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { useConfirm } from '@/hooks/use-confirm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListToolbar } from '@/components/ui/list-toolbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import applications from '@/routes/app/applications';
import {
  GigOfferStatus,
  getGigOfferStatusLabel,
  getGigOfferStatusVariant,
} from '@/types/enum';
import type { GigOffer, Paginated } from '../types';
import { GigCard } from './gig-card';
import { Pagination } from './pagination';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  {
    value: GigOfferStatus.PENDING,
    label: getGigOfferStatusLabel(GigOfferStatus.PENDING),
  },
  {
    value: GigOfferStatus.ACCEPTED,
    label: getGigOfferStatusLabel(GigOfferStatus.ACCEPTED),
  },
  {
    value: GigOfferStatus.REJECTED,
    label: getGigOfferStatusLabel(GigOfferStatus.REJECTED),
  },
  {
    value: GigOfferStatus.WITHDRAWN,
    label: getGigOfferStatusLabel(GigOfferStatus.WITHDRAWN),
  },
];

type ApplicationListProps = {
  offers: Paginated<GigOffer>;
  filters?: { search?: string; status?: string };
};

export function ApplicationList({ offers, filters }: ApplicationListProps) {
  const form = useForm({});
  const [confirm, confirmDialog] = useConfirm();
  const [search, setSearch] = useState(filters?.search ?? '');
  const [status, setStatus] = useState(filters?.status ?? 'all');

  const hasActiveFilters = Boolean(status && status !== 'all');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      applications.index.url({
        query: {
          ...(search ? { search } : {}),
          ...(status !== 'all' ? { status } : {}),
        },
      }),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  const activeOffers = offers.data.filter((offer) => offer.is_active);
  const historyOffers = offers.data.filter((offer) => !offer.is_active);

  const renderOfferCard = (offer: GigOffer) => {
    if (!offer.gig) return null;

    return (
      <div
        key={offer.id}
        className={`flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-all sm:p-5 ${
          !offer.is_active ? 'opacity-90' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground">
              Penawaran Anda:
            </span>
            <span className="text-base font-bold text-foreground">
              Rp{offer.offered_fee.toLocaleString('id-ID')}
            </span>
          </div>
          <Badge variant={getGigOfferStatusVariant(offer.status)}>
            {getGigOfferStatusLabel(offer.status)}
          </Badge>
        </div>

        {offer.note && (
          <div className="rounded-xl border border-border/40 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <span className="mb-0.5 block font-medium text-foreground">
              Catatan Lamaran:
            </span>
            "{offer.note}"
          </div>
        )}

        <GigCard gig={offer.gig}>
          {offer.status === GigOfferStatus.PENDING && (
            <Button
              variant="destructive"
              disabled={form.processing}
              onClick={() => {
                confirm({
                  title: 'Tarik Lamaran',
                  description: `Apakah Anda yakin ingin menarik lamaran untuk gig "${offer.gig?.title ?? ''}"?`,
                  confirmLabel: 'Tarik Lamaran',
                  cancelLabel: 'Batal',
                  destructive: true,
                  onConfirm: () => form.patch(withdraw.url(offer)),
                });
              }}
            >
              Tarik lamaran
            </Button>
          )}
        </GigCard>
      </div>
    );
  };

  return (
    <AppPage
      title="Lamaran Saya"
      description="Kelola dan pantau status lamaran pekerjaan yang telah Anda ajukan."
    >
      <AppPageCard>
        <form onSubmit={submit}>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari judul, deskripsi, atau catatan lamaran..."
            filterLabel="Filter lamaran"
            hasActiveFilters={hasActiveFilters}
          >
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Status Lamaran
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
                  applications.index.url({
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

      <div className="flex flex-col gap-6">
        {activeOffers.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
                Lamaran Aktif ({activeOffers.length})
              </h2>
            </div>
            {activeOffers.map(renderOfferCard)}
          </div>
        )}

        {historyOffers.length > 0 && (
          <div className="flex flex-col gap-4 pt-2">
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 font-semibold tracking-wider text-muted-foreground">
                  Riwayat / Non-Aktif ({historyOffers.length})
                </span>
              </div>
            </div>
            {historyOffers.map(renderOfferCard)}
          </div>
        )}

        {offers.data.length === 0 && (
          <AppPageCard className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileSearch className="size-6" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Belum ada lamaran
            </span>
            <p className="text-xs text-muted-foreground max-w-sm">
              {hasActiveFilters || search
                ? 'Tidak ada lamaran yang cocok dengan kata kunci atau filter terpilih.'
                : 'Anda belum melamar pekerjaan mikro apapun. Silakan jelajahi gig dan ajukan penawaran Anda.'}
            </p>
          </AppPageCard>
        )}

        <Pagination page={offers} />
        {confirmDialog}
      </div>
    </AppPage>
  );
}
