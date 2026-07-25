import { useForm } from '@inertiajs/react';
import {
  accept,
  reject,
} from '@/actions/App/Http/Controllers/GigOfferController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { GigOfferStatus, getGigOfferStatusLabel } from '@/types/enum';
import type { Gig, GigOffer, Paginated } from '../types';
import { Pagination } from './pagination';

export function ApplicantList({
  gig,
  offers,
}: {
  gig: Gig;
  offers: Paginated<GigOffer>;
}) {
  const form = useForm({});

  return (
    <AppPage title={`Pelamar: ${gig.title}`}>
      <div className="flex flex-col gap-4">
        {offers.data.map((offer) => (
          <AppPageCard key={offer.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src={offer.freelancer?.avatar_url}
                alt=""
                className="size-10 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold">{offer.freelancer?.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {offer.freelancer?.location ?? 'Lokasi belum diisi'}
                </p>
              </div>
            </div>
            <p>Status: {getGigOfferStatusLabel(offer.status)}</p>
            <p>Penawaran: Rp{offer.offered_fee.toLocaleString('id-ID')}</p>
            <p>Catatan: {offer.note ?? 'Tidak ada'}</p>
            <p className="text-sm text-muted-foreground">
              Dikirim: {offer.created_at}
            </p>
            <div>
              <p className="font-medium">
                {offer.freelancer?.freelancer_profile?.title ?? 'Freelancer'}
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {offer.freelancer?.freelancer_profile?.bio ?? 'Belum ada bio.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Keahlian:{' '}
                {offer.freelancer?.freelancer_profile?.skills.join(', ') ||
                  'Belum diisi'}
              </p>
            </div>
            {offer.status === GigOfferStatus.PENDING && (
              <div className="flex gap-2">
                <Button
                  disabled={form.processing}
                  onClick={() => form.patch(accept.url(offer))}
                >
                  Terima
                </Button>
                <Button
                  variant="destructive"
                  disabled={form.processing}
                  onClick={() => form.patch(reject.url(offer))}
                >
                  Tolak
                </Button>
              </div>
            )}
          </AppPageCard>
        ))}
        <Pagination page={offers} />
      </div>
    </AppPage>
  );
}
