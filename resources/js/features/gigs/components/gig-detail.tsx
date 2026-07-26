import { Link, useForm } from '@inertiajs/react';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Coins,
  MapPin,
  Navigation,
  Tag,
  Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { cancel } from '@/actions/App/Http/Controllers/GigController';
import {
  store as apply,
  withdraw,
} from '@/actions/App/Http/Controllers/GigOfferController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDate } from '@/lib/date';
import { capitalize } from '@/lib/utils';
import { index as applicants } from '@/routes/app/client/gigs/applicants';
import { show as agreement } from '@/routes/app/gigs/agreement';
import { show as workflow } from '@/routes/app/gigs/workflow';
import { show as showProfile } from '@/routes/app/profile';
import {
  GigOfferStatus,
  GigStatus,
  getGigCategoryLabel,
  getGigOfferStatusLabel,
  getGigStatusLabel,
  getGigStatusVariant,
} from '@/types/enum';
import { useGigDistance } from '../hooks/use-gig-distance';
import type { Gig, GigOffer } from '../types';

type GigDetailProps = {
  gig: Gig;
  my_offer: GigOffer | null;
  can_apply: boolean;
  is_owner: boolean;
  has_current_agreement: boolean;
  has_reached_pending_limit?: boolean;
  has_active_accepted_work?: boolean;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case GigStatus.Open:
    case GigStatus.Completed:
      return 'success';
    case GigStatus.InProgress:
    case GigStatus.AgreementPreparation:
    case GigStatus.Disputed:
    case GigStatus.DisputeResolved:
      return 'warning';
    case GigStatus.Cancelled:
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getOfferBadgeVariant = (status: string) => {
  switch (status) {
    case GigOfferStatus.PENDING:
      return 'warning';
    case GigOfferStatus.ACCEPTED:
      return 'success';
    case GigOfferStatus.REJECTED:
    case GigOfferStatus.WITHDRAWN:
    case GigOfferStatus.AUTO_WITHDRAWN:
      return 'destructive';
    default:
      return 'secondary';
  }
};

const workflowStatuses: string[] = [
  GigStatus.Locked,
  GigStatus.InProgress,
  GigStatus.Disputed,
  GigStatus.DisputeResolved,
];

export function GigDetail({
  gig,
  my_offer: myOffer,
  can_apply: canApply,
  is_owner: isOwner,
  has_current_agreement: hasCurrentAgreement,
  has_reached_pending_limit: hasReachedPendingLimit = false,
  has_active_accepted_work: hasActiveAcceptedWork = false,
}: GigDetailProps) {
  const form = useForm({ offered_fee: '', note: '' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.post(apply.url(gig));
  };
  const cancelGig = () => form.patch(cancel.url(gig));

  const isWithdrawn =
    myOffer !== null &&
    (myOffer.status === GigOfferStatus.WITHDRAWN ||
      myOffer.status === GigOfferStatus.AUTO_WITHDRAWN);
  const showApplyForm =
    canApply &&
    !hasReachedPendingLimit &&
    !hasActiveAcceptedWork &&
    (myOffer === null || isWithdrawn);

  const isAcceptedWorker =
    !isOwner && myOffer?.status === GigOfferStatus.ACCEPTED;

  const {
    distanceFormatted,
    workerAccuracy,
    isAccurate,
    loading: distanceLoading,
  } = useGigDistance({
    gigLatitude: gig.location_latitude,
    gigLongitude: gig.location_longitude,
    gigAccuracy: gig.location_accuracy_meters,
    enabled: isAcceptedWorker && Boolean(gig.location_latitude),
  });

  return (
    <AppPage
      title="Detail Gig"
      description="Informasi lengkap mengenai rincian pekerjaan, lokasi, dan status penawaran."
    >
      <div className="flex flex-col gap-6">
        <AppPageCard className="flex flex-col gap-5">
          {!isOwner && gig.client && (
            <Link
              href={showProfile({ user: gig.client.id }).url}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/50 p-3.5 transition-colors hover:bg-secondary"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  user={{
                    name: gig.client.name,
                    avatar_url: gig.client.avatar_url,
                  }}
                  size="sm"
                  className="size-11 shrink-0"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Pemberi Kerja (Klien)
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground">
                    {gig.client.name}
                  </span>
                  {gig.client.location && (
                    <span className="truncate text-xs text-muted-foreground">
                      {capitalize(gig.client.location, true)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )}

          {gig.media && gig.media.length > 0 && (
            <PhotoProvider>
              <div className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                {gig.media.map((media) => (
                  <PhotoView key={media.id} src={media.url}>
                    <img
                      src={media.url}
                      alt={gig.title}
                      className="aspect-video w-[280px] shrink-0 cursor-pointer snap-start rounded-xl border border-border/40 object-cover transition-opacity hover:opacity-95 sm:w-[320px]"
                    />
                  </PhotoView>
                ))}
              </div>
            </PhotoProvider>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {gig.title}
            </h2>
            <Badge
              variant={getGigStatusVariant(gig.status)}
              className="px-3 py-1 font-medium"
            >
              {getGigStatusLabel(gig.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-secondary/40 p-3">
              <Tag className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Kategori
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {getGigCategoryLabel(gig.category)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-secondary/40 p-3">
              <Coins className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Biaya / Upah
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Rp{gig.posted_fee.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-secondary/40 p-3">
              <Calendar className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Jadwal Pekerjaan
                </span>
                <span className="font-semibold text-foreground">
                  {gig.scheduled_at
                    ? formatDate(gig.scheduled_at, 'dd MMMM yyyy · HH:mm')
                    : `${gig.work_date} · ${gig.start_time}`}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-secondary/40 p-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Lokasi Pekerjaan
                </span>
                <span className="font-semibold text-foreground">
                  {gig.location_address
                    ? `${gig.location_address}, ${gig.regency_name}, ${gig.province_name}`
                    : `${gig.regency_name}, ${gig.province_name}`}
                </span>
              </div>
            </div>

            {isAcceptedWorker && gig.location_latitude && (
              <div className="flex flex-col gap-2.5 rounded-xl border border-border/40 bg-secondary/40 p-3.5 sm:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <Navigation className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Koordinat GPS & Navigasi
                      </span>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {gig.location_latitude}, {gig.location_longitude}
                        {(gig.location_accuracy_meters as number) > 0 &&
                          ` (Akurasi: ±${gig.location_accuracy_meters}m)`}
                      </span>
                    </div>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${gig.location_latitude},${gig.location_longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Petunjuk Arah
                    </a>
                  </Button>
                </div>

                {distanceLoading && (
                  <p className="animate-pulse text-xs text-muted-foreground">
                    Menghitung perkiraan jarak...
                  </p>
                )}

                {!distanceLoading && distanceFormatted && isAccurate && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    <span>
                      Perkiraan jarak dari lokasi Anda:{' '}
                      <strong>{distanceFormatted}</strong>
                    </span>
                    {workerAccuracy && (
                      <span className="text-[10px] text-muted-foreground">
                        (Akurasi GPS Anda: ±{workerAccuracy}m)
                      </span>
                    )}
                  </div>
                )}

                {!distanceLoading && distanceFormatted && !isAccurate && (
                  <p className="text-xs text-muted-foreground italic">
                    Perkiraan jarak tidak ditampilkan karena akurasi lokasi
                    &gt;400m.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Deskripsi Pekerjaan
            </span>
            <div className="rounded-xl border border-border/40 bg-secondary/30 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {gig.description}
            </div>
          </div>

          {isOwner && (
            <div className="flex flex-col gap-3 border-t border-border/60 pt-2">
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Users className="size-4 shrink-0 text-primary" />
                  <span>
                    <strong>{gig.pending_applicants_count ?? 0} Pelamar</strong>{' '}
                    <span className="text-muted-foreground">
                      menunggu peninjauan Anda
                    </span>
                  </span>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="default"
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Link href={applicants(gig)}>
                    Lihat Pelamar <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {hasCurrentAgreement && (
                  <Button asChild variant="outline">
                    <Link href={agreement(gig)}>Lihat persetujuan</Link>
                  </Button>
                )}
                {workflowStatuses.includes(gig.status) && (
                  <Button asChild variant="outline">
                    <Link href={workflow(gig)}>Lihat workflow</Link>
                  </Button>
                )}
                {(gig.status === GigStatus.Open ||
                  gig.status === GigStatus.AgreementPreparation) && (
                  <Button variant="destructive" onClick={cancelGig}>
                    Batalkan gig
                  </Button>
                )}
              </div>
            </div>
          )}
        </AppPageCard>
        {canApply &&
          hasReachedPendingLimit &&
          (myOffer === null || isWithdrawn) && (
            <AppPageCard>
              <p className="text-sm text-muted-foreground">
                Anda telah mencapai batas maksimal 3 penawaran aktif (pending).
                Tarik salah satu lamaran Anda untuk melamar gig ini.
              </p>
            </AppPageCard>
          )}
        {canApply &&
          hasActiveAcceptedWork &&
          (myOffer === null || isWithdrawn) && (
            <AppPageCard>
              <p className="text-sm text-muted-foreground">
                Anda memiliki pekerjaan aktif yang sedang berjalan dan tidak
                dapat melamar gig lain sampai pekerjaan tersebut selesai.
              </p>
            </AppPageCard>
          )}
        {showApplyForm && (
          <AppPageCard>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <h2 className="font-semibold">
                {isWithdrawn ? 'Ajukan penawaran baru' : 'Lamar gig ini'}
              </h2>
              {isWithdrawn && (
                <p className="text-xs text-muted-foreground">
                  Penawaran sebelumnya (
                  {getGigOfferStatusLabel(myOffer?.status)}) telah dibatalkan.
                  Anda dapat mengajukan penawaran baru.
                </p>
              )}
              <Input
                type="number"
                min="1000"
                placeholder={`Biaya tawaran, default Rp${gig.posted_fee.toLocaleString('id-ID')}`}
                value={form.data.offered_fee}
                onChange={(e) => form.setData('offered_fee', e.target.value)}
              />
              <Textarea
                placeholder="Catatan opsional"
                value={form.data.note}
                onChange={(e) => form.setData('note', e.target.value)}
              />
              {form.errors.offered_fee && (
                <p className="text-sm text-destructive">
                  {form.errors.offered_fee}
                </p>
              )}
              {form.errors.note && (
                <p className="text-sm text-destructive">{form.errors.note}</p>
              )}
              <Button type="submit" disabled={form.processing}>
                {isWithdrawn ? 'Kirim penawaran baru' : 'Kirim penawaran'}
              </Button>
            </form>
          </AppPageCard>
        )}
        {myOffer && !isWithdrawn && (
          <AppPageCard className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Penawaran Anda
                </span>
                <span className="font-bold text-foreground text-lg">
                  Rp{myOffer.offered_fee.toLocaleString('id-ID')}
                </span>
              </div>
              <Badge
                variant={getOfferBadgeVariant(myOffer.status)}
                className="px-3 py-1 font-medium"
              >
                {getGigOfferStatusLabel(myOffer.status)}
              </Badge>
            </div>

            {myOffer.note && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Catatan Penawaran
                </span>
                <div className="rounded-xl bg-secondary/30 p-3 border border-border/40 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {myOffer.note}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-border/40">
              {myOffer.status === GigOfferStatus.PENDING && (
                <Button
                  variant="destructive"
                  disabled={form.processing}
                  onClick={() => form.patch(withdraw.url(myOffer))}
                >
                  Tarik lamaran
                </Button>
              )}
              {hasCurrentAgreement &&
                myOffer.status === GigOfferStatus.ACCEPTED && (
                  <Button asChild variant="default">
                    <Link href={agreement(gig)}>Lihat persetujuan</Link>
                  </Button>
                )}
              {workflowStatuses.includes(gig.status) &&
                myOffer.status === GigOfferStatus.ACCEPTED && (
                  <Button asChild variant="outline">
                    <Link href={workflow(gig)}>Lihat workflow</Link>
                  </Button>
                )}
            </div>
          </AppPageCard>
        )}
      </div>
    </AppPage>
  );
}
