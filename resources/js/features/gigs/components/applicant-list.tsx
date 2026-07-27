import { Link, router, useForm } from '@inertiajs/react';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Coins,
  MapPin,
  Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  accept,
  reject,
} from '@/actions/App/Http/Controllers/GigOfferController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
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
import { UserAvatar } from '@/components/ui/user-avatar';
import { useConfirm } from '@/hooks/use-confirm';
import { formatDate } from '@/lib/date';
import { capitalize } from '@/lib/utils';
import applicants from '@/routes/app/client/gigs/applicants';
import { show as showGig } from '@/routes/app/gigs';
import { show as showProfile } from '@/routes/app/profile';
import {
  GigOfferStatus,
  getGigCategoryLabel,
  getGigOfferStatusLabel,
  getGigOfferStatusVariant,
  getGigStatusLabel,
  getGigStatusVariant,
} from '@/types/enum';
import type { Gig, GigOffer, Paginated } from '../types';
import { Pagination } from './pagination';

type ApplicantListProps = {
  gig: Gig;
  offers: Paginated<GigOffer>;
  filters?: { search?: string; status?: string };
  pendingOffersCount: number;
};

export function ApplicantList({
  gig,
  offers,
  filters,
  pendingOffersCount,
}: ApplicantListProps) {
  const [confirm, confirmDialog] = useConfirm();
  const form = useForm({});
  const [search, setSearch] = useState(filters?.search ?? '');
  const [status, setStatus] = useState(filters?.status ?? 'all');

  const hasActiveFilters = Boolean(status && status !== 'all');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      applicants.index.url(
        { gig: gig.id },
        {
          query: {
            ...(search ? { search } : {}),
            ...(status !== 'all' ? { status } : {}),
          },
        },
      ),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  return (
    <AppPage
      title={`Pelamar: ${gig.title}`}
      description="Tinjau dan kelola penawaran dari para pekerja untuk gig ini."
    >
      <div className="flex flex-col gap-6">
        <AppPageCard className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Link href={showGig({ gig: gig.id })}>
                <ArrowLeft className="size-4" /> Kembali ke Detail Gig
              </Link>
            </Button>
            <Badge
              variant={getGigStatusVariant(gig.status)}
              className="px-3 py-1 font-medium"
            >
              {getGigStatusLabel(gig.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-secondary/40 p-3">
              <Coins className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Anggaran Gig
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Rp{gig.posted_fee.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-secondary/40 p-3">
              <Users className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Pelamar Pending
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {pendingOffersCount} Pelamar
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-secondary/40 p-3">
              <Calendar className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Kategori Gig
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {getGigCategoryLabel(gig.category)}
                </span>
              </div>
            </div>
          </div>
        </AppPageCard>

        <AppPageCard>
          <form onSubmit={submit}>
            <ListToolbar
              search={search}
              onSearchChange={setSearch}
              placeholder="Cari nama pelamar, keahlian, atau catatan..."
              filterLabel="Filter pelamar"
              hasActiveFilters={hasActiveFilters}
            >
              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Status Pelamar
                </span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value={GigOfferStatus.PENDING}>
                      Pending (Menunggu)
                    </SelectItem>
                    <SelectItem value={GigOfferStatus.ACCEPTED}>
                      Diterima
                    </SelectItem>
                    <SelectItem value={GigOfferStatus.REJECTED}>
                      Ditolak
                    </SelectItem>
                    <SelectItem value={GigOfferStatus.WITHDRAWN}>
                      Dibatalkan
                    </SelectItem>
                    <SelectItem value={GigOfferStatus.AUTO_WITHDRAWN}>
                      Ditarik Otomatis
                    </SelectItem>
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
                    applicants.index.url(
                      { gig: gig.id },
                      { query: search ? { search } : {} },
                    ),
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

        {offers.data.length === 0 ? (
          <AppPageCard className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 size-12 text-muted-foreground/50" />
            <h3 className="text-base font-semibold text-foreground">
              Tidak ada pelamar ditemukan
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {search || hasActiveFilters
                ? 'Tidak ada pelamar yang cocok dengan kriteria pencarian Anda.'
                : 'Belum ada pekerja yang mengajukan penawaran untuk gig ini.'}
            </p>
          </AppPageCard>
        ) : (
          <div className="flex flex-col gap-4">
            {offers.data.map((offer) => {
              const diffFee = offer.offered_fee - gig.posted_fee;
              const isLowerOrEqual = diffFee <= 0;

              return (
                <AppPageCard key={offer.id} className="flex flex-col gap-4">
                  {offer.freelancer && (
                    <Link
                      href={showProfile({ user: offer.freelancer.id }).url}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/50 p-3.5 transition-colors hover:bg-secondary"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          user={{
                            name: offer.freelancer.name,
                            avatar_url: offer.freelancer.avatar_url,
                          }}
                          size="sm"
                          className="size-11 shrink-0"
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            {offer.freelancer.freelancer_profile?.title ||
                              'Pekerja (Freelancer)'}
                          </span>
                          <span className="truncate text-sm font-semibold text-foreground">
                            {offer.freelancer.name}
                          </span>
                          {offer.freelancer.location && (
                            <span className="truncate text-xs text-muted-foreground">
                              {capitalize(offer.freelancer.location, true)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant={getGigOfferStatusVariant(offer.status)}
                      className="px-3 py-1 font-medium"
                    >
                      {getGigOfferStatusLabel(offer.status)}
                    </Badge>
                    {offer.created_at && (
                      <span className="text-xs text-muted-foreground">
                        Dikirim{' '}
                        {formatDate(offer.created_at, 'dd MMM yyyy · HH:mm')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-secondary/30 p-3">
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Penawaran Biaya
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-bold text-foreground">
                          Rp{offer.offered_fee.toLocaleString('id-ID')}
                        </span>
                        {diffFee === 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Sesuai Anggaran
                          </span>
                        ) : diffFee < 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Hemat Rp{Math.abs(diffFee).toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            +Rp{diffFee.toLocaleString('id-ID')} di atas
                            anggaran
                          </span>
                        )}
                      </div>
                    </div>

                    {offer.freelancer?.freelancer_profile?.skills &&
                      offer.freelancer.freelancer_profile.skills.length > 0 && (
                        <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-secondary/30 p-3">
                          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Keahlian
                          </span>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {offer.freelancer.freelancer_profile.skills.map(
                              (skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="px-2 py-0 text-[10px]"
                                >
                                  {skill}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {offer.note && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Catatan Pelamar
                      </span>
                      <div className="rounded-xl border border-border/40 bg-secondary/20 p-3 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                        {offer.note}
                      </div>
                    </div>
                  )}

                  {offer.freelancer?.freelancer_profile?.bio && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Bio Pekerja
                      </span>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {offer.freelancer.freelancer_profile.bio}
                      </p>
                    </div>
                  )}

                  {offer.status === GigOfferStatus.PENDING && (
                    <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={form.processing}
                        onClick={() =>
                          confirm({
                            title: 'Tolak pelamar ini?',
                            description: `Penawaran dari ${offer.freelancer?.name ?? 'pelamar'} akan ditolak. Pelamar akan menerima notifikasi.`,
                            confirmLabel: 'Ya, tolak pelamar',
                            destructive: true,
                            onConfirm: () => form.patch(reject.url(offer)),
                          })
                        }
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        Tolak
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={form.processing}
                        onClick={() =>
                          confirm({
                            title: 'Terima pelamar ini?',
                            description: `Anda akan memilih ${offer.freelancer?.name ?? 'pelamar'} untuk mengerjakan gig ini (Rp${offer.offered_fee.toLocaleString('id-ID')}). Alur persetujuan gig akan dimulai.`,
                            confirmLabel: 'Ya, terima pelamar',
                            onConfirm: () => form.patch(accept.url(offer)),
                          })
                        }
                      >
                        Terima Pelamar
                      </Button>
                    </div>
                  )}
                </AppPageCard>
              );
            })}
          </div>
        )}

        <Pagination page={offers} />
      </div>
      {confirmDialog}
    </AppPage>
  );
}
