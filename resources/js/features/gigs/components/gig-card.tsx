import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { show } from '@/routes/app/gigs';
import { getGigCategoryLabel, getGigStatusLabel } from '@/types/enum';
import type { Gig } from '../types';

type GigCardProps = {
  gig: Gig;
  children?: ReactNode;
};

export function GigCard({ gig, children }: GigCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs">
      {gig.media[0] && (
        <img
          src={gig.media[0].url}
          alt=""
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{gig.title}</h2>
          <span className="rounded-full bg-muted px-2 py-1 text-xs">
            {getGigStatusLabel(gig.status)}
          </span>
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          {getGigCategoryLabel(gig.category)}
        </p>
        <p className="text-sm text-muted-foreground">
          {gig.regency_name}, {gig.province_name}
        </p>
        <p className="text-sm">
          {gig.work_date} · {gig.start_time} · Rp
          {gig.posted_fee.toLocaleString('id-ID')}
        </p>
        {gig.pending_applicants_count !== undefined && (
          <p className="text-sm text-muted-foreground">
            {gig.pending_applicants_count} pelamar menunggu
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={show(gig)}>Detail</Link>
        </Button>
        {children}
      </div>
    </article>
  );
}
