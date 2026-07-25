import { useForm } from '@inertiajs/react';
import { withdraw } from '@/actions/App/Http/Controllers/GigOfferController';
import { AppPage } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { GigOfferStatus, getGigOfferStatusLabel } from '@/types/enum';
import type { GigOffer, Paginated } from '../types';
import { GigCard } from './gig-card';
import { Pagination } from './pagination';

export function ApplicationList({ offers }: { offers: Paginated<GigOffer> }) {
  const form = useForm({});

  return (
    <AppPage title="Lamaran">
      <div className="flex flex-col gap-4">
        {offers.data.map(
          (offer) =>
            offer.gig && (
              <GigCard key={offer.id} gig={offer.gig}>
                <div className="text-sm">
                  Penawaran Anda: Rp{offer.offered_fee.toLocaleString('id-ID')}{' '}
                  · {getGigOfferStatusLabel(offer.status)}
                </div>
                {offer.note && (
                  <p className="w-full text-sm text-muted-foreground">
                    {offer.note}
                  </p>
                )}
                {offer.status === GigOfferStatus.PENDING && (
                  <Button
                    variant="destructive"
                    disabled={form.processing}
                    onClick={() => form.patch(withdraw.url(offer))}
                  >
                    Tarik lamaran
                  </Button>
                )}
              </GigCard>
            ),
        )}
        <Pagination page={offers} />
      </div>
    </AppPage>
  );
}
