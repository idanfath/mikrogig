import { Link, usePage } from '@inertiajs/react';
import { Calendar, ChevronRight, Scale, Star, User } from 'lucide-react';
import { AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDate } from '@/lib/date';
import history from '@/routes/app/history';
import profile from '@/routes/app/profile';
import {
  getGigSettlementOutcomeLabel,
  getGigStatusLabel,
  getGigStatusVariant,
} from '@/types/enum';
import type { HistorySummary } from '../history-types';

type GigHistoryCardProps = {
  gig: HistorySummary;
};

export function GigHistoryCard({ gig }: GigHistoryCardProps) {
  const { auth } = usePage<{ auth?: { user?: { role: string } } }>().props;
  const isClient = auth?.user?.role === 'client';

  const freelancerPayoutLabel = isClient
    ? 'Dibayarkan ke pekerja'
    : 'Dibayarkan ke kamu';
  const clientRefundLabel = isClient
    ? 'Dikembalikan ke kamu'
    : 'Dikembalikan ke klien';

  return (
    <AppPageCard className="flex flex-col gap-4 transition-all hover:border-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
            {gig.title}
          </h2>
          {gig.terminal_at && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="leading-none">
                Selesai pada {formatDate(gig.terminal_at, 'dd MMM yyyy, HH:mm')}
              </span>
            </div>
          )}
        </div>
        <Badge variant={getGigStatusVariant(gig.status)} className="shrink-0">
          {getGigStatusLabel(gig.status)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3 text-xs">
        <div>
          {gig.counterpart ? (
            <Link
              href={profile.show(gig.counterpart.id)}
              className="group flex items-center gap-2.5 transition-colors"
            >
              <UserAvatar user={gig.counterpart} size="sm" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Mitra Kerja
                </span>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {gig.counterpart.name}
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="size-4" />
              <span className="text-xs">Belum ada penyedia jasa</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/40 px-2.5 py-1 border border-border/40">
          <div className="flex items-center gap-1">
            <Star
              className={`size-3.5 ${
                gig.viewer_has_rated
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-muted-foreground/40'
              }`}
            />
            {gig.viewer_has_rated && gig.viewer_rating ? (
              <span className="text-xs font-bold text-foreground">
                {gig.viewer_rating}.0
              </span>
            ) : null}
          </div>
          <span
            className={`text-xs ${
              gig.viewer_has_rated
                ? 'font-medium text-muted-foreground'
                : 'font-normal text-muted-foreground'
            }`}
          >
            {gig.viewer_has_rated ? 'Ulasan Anda' : 'Belum ada ulasan'}
          </span>
        </div>
      </div>

      {gig.settlement && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-border/40 bg-muted/40 p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Scale className="size-4 shrink-0 text-primary" />
            <span>
              Penyelesaian:{' '}
              {getGigSettlementOutcomeLabel(gig.settlement.outcome)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col rounded-lg border border-border/30 bg-card/80 p-2.5">
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {freelancerPayoutLabel}
              </span>
              <span
                className={`mt-0.5 text-xs ${
                  gig.settlement.freelancer_payout > 0
                    ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                    : 'font-normal text-muted-foreground'
                }`}
              >
                Rp{gig.settlement.freelancer_payout.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex flex-col rounded-lg border border-border/30 bg-card/80 p-2.5">
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {clientRefundLabel}
              </span>
              <span
                className={`mt-0.5 text-xs ${
                  gig.settlement.client_refund > 0
                    ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                    : 'font-normal text-muted-foreground'
                }`}
              >
                Rp{gig.settlement.client_refund.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Link href={history.show(gig.id)}>
            Lihat Detail Riwayat
            <ChevronRight className="size-4" data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </AppPageCard>
  );
}
