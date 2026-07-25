import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { cancel } from '@/actions/App/Http/Controllers/GigController';
import { store as apply } from '@/actions/App/Http/Controllers/GigOfferController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { index as applicants } from '@/routes/app/client/gigs/applicants';
import type { Gig, GigOffer } from '../types';

type GigDetailProps = {
  gig: Gig;
  my_offer: GigOffer | null;
  can_apply: boolean;
  is_owner: boolean;
};

export function GigDetail({
  gig,
  my_offer: myOffer,
  can_apply: canApply,
  is_owner: isOwner,
}: GigDetailProps) {
  const form = useForm({ offered_fee: '', note: '' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.post(apply.url(gig));
  };
  const cancelGig = () => form.patch(cancel.url(gig));

  const isWithdrawn =
    myOffer !== null &&
    ['withdrawn', 'auto_withdrawn'].includes(myOffer.status);
  const showApplyForm = canApply && (myOffer === null || isWithdrawn);

  return (
    <AppPage title={gig.title}>
      <div className="flex flex-col gap-6">
        <AppPageCard className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {gig.media.map((media) => (
              <img
                key={media.id}
                src={media.url}
                alt={gig.title}
                className="aspect-video w-full rounded-lg object-cover"
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{gig.title}</h2>
            <span className="rounded-full bg-muted px-2 py-1 text-xs">
              {gig.status}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{gig.description}</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Kategori</dt>
              <dd>{gig.category}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Biaya</dt>
              <dd>Rp{gig.posted_fee.toLocaleString('id-ID')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Jadwal</dt>
              <dd>
                {gig.work_date} · {gig.start_time}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lokasi</dt>
              <dd>
                {gig.location_address}, {gig.regency_name}, {gig.province_name}
              </dd>
            </div>
            {gig.location_latitude && (
              <div>
                <dt className="text-muted-foreground">Koordinat</dt>
                <dd>
                  {gig.location_latitude}, {gig.location_longitude}
                </dd>
              </div>
            )}
            {gig.location_accuracy_meters !== null && (
              <div>
                <dt className="text-muted-foreground">Akurasi</dt>
                <dd>{gig.location_accuracy_meters} m</dd>
              </div>
            )}
          </dl>
          <p className="text-sm text-muted-foreground">
            Klien: {gig.client.name} · {gig.pending_applicants_count ?? 0}{' '}
            pelamar
          </p>
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={applicants(gig)}>Lihat pelamar</Link>
              </Button>
              {['open', 'agreement_preparation'].includes(gig.status) && (
                <Button variant="destructive" onClick={cancelGig}>
                  Batalkan gig
                </Button>
              )}
            </div>
          )}
        </AppPageCard>
        {showApplyForm && (
          <AppPageCard>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <h2 className="font-semibold">
                {isWithdrawn ? 'Ajukan penawaran baru' : 'Lamar gig ini'}
              </h2>
              {isWithdrawn && (
                <p className="text-xs text-muted-foreground">
                  Penawaran sebelumnya ({myOffer?.status}) telah dibatalkan.
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
          <AppPageCard>
            <p>
              Penawaran Anda: <strong>{myOffer.status}</strong>, Rp
              {myOffer.offered_fee.toLocaleString('id-ID')}
            </p>
            {myOffer.note && (
              <p className="mt-2 text-sm text-muted-foreground">
                {myOffer.note}
              </p>
            )}
          </AppPageCard>
        )}
      </div>
    </AppPage>
  );
}
