import { Link } from '@inertiajs/react';
import { Calendar, MapPin, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import { show } from '@/routes/app/gigs';
import {
  getGigCategoryLabel,
  getGigStatusLabel,
  getGigStatusVariant,
} from '@/types/enum';
import type { Gig } from '../types';

type GigCardProps = {
  gig: Gig;
  children?: ReactNode;
};

export function GigCard({ gig, children }: GigCardProps) {
  const scheduleLabel = gig.scheduled_at
    ? formatDate(gig.scheduled_at, 'dd MMM yyyy · HH:mm')
    : `${gig.work_date} · ${gig.start_time}`;

  return (
    <article className="group flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:flex-row sm:gap-5 sm:p-5">
      {gig.media[0] && (
        <div className="hidden shrink-0 overflow-hidden rounded-xl sm:block sm:w-40">
          <PhotoProvider>
            <PhotoView src={gig.media[0].url}>
              <img
                src={gig.media[0].url}
                alt={gig.title}
                className="aspect-video h-full w-full cursor-pointer object-cover sm:aspect-square"
              />
            </PhotoView>
            {gig.media.slice(1).map((media) => (
              <PhotoView key={media.id} src={media.url}>
                <span className="hidden" />
              </PhotoView>
            ))}
          </PhotoProvider>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="truncate text-base leading-snug font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {gig.title}
            </h2>
            <div className="shrink-0 text-base font-bold text-primary sm:ml-2">
              Rp {gig.posted_fee.toLocaleString('id-ID')}
            </div>
          </div>

          {gig.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {gig.description}
            </p>
          )}

          <div className="flex flex-col gap-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getGigStatusVariant(gig.status)} size="default">
                {getGigStatusLabel(gig.status)}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                {getGigCategoryLabel(gig.category)}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-muted-foreground/80" />
              <span>
                {gig.regency_name}, {gig.province_name}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0 text-muted-foreground/80" />
              <span>{scheduleLabel}</span>
            </div>

            {gig.pending_applicants_count !== undefined && (
              <div className="flex items-center gap-1.5 font-medium text-primary">
                <Users className="size-3.5 shrink-0" />
                <span>{gig.pending_applicants_count} pelamar menunggu</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <Button asChild variant="outline">
            <Link href={show(gig)}>Detail Gig</Link>
          </Button>
          {children}
        </div>
      </div>
    </article>
  );
}
