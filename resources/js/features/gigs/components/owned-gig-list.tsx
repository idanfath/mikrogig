import { Link, useForm } from '@inertiajs/react';
import { cancel } from '@/actions/App/Http/Controllers/GigController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { create } from '@/routes/app/gigs';
import type { Gig, Paginated } from '../types';
import { GigCard } from './gig-card';
import { Pagination } from './pagination';

export function OwnedGigList({ gigs }: { gigs: Paginated<Gig> }) {
  const form = useForm({});

  return (
    <AppPage title="Gig Saya">
      <div className="flex flex-col gap-4">
        <Button asChild>
          <Link href={create()}>Buat Gig</Link>
        </Button>
        {gigs.data.map((gig) => (
          <GigCard key={gig.id} gig={gig}>
            {['open', 'agreement_preparation'].includes(gig.status) && (
              <Button
                variant="destructive"
                disabled={form.processing}
                onClick={() => form.patch(cancel.url(gig))}
              >
                Batalkan
              </Button>
            )}
          </GigCard>
        ))}
        {gigs.data.length === 0 && <AppPageCard>Belum ada gig.</AppPageCard>}
        <Pagination page={gigs} />
      </div>
    </AppPage>
  );
}
