import { useEffect } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
} from 'lucide-react';
import { cancel } from '@/actions/App/Http/Controllers/GigController';
import {
  mockCheckout,
  retryCheckout,
} from '@/actions/App/Http/Controllers/GigPaymentController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { useServerClock } from '@/hooks/use-server-clock';
import { formatDate } from '@/lib/date';
import { show as workflow } from '@/routes/app/gigs/workflow';
import {
  GigPaymentStatus,
  getGigPaymentStatusLabel,
  getGigPaymentStatusVariant,
} from '@/types/enum';
import type { GigConversation as GigConversationData } from '../conversation-types';
import type { GigPayment, GigPaymentSummary } from '../types';
import { GigConversation } from './gig-conversation';

type Props = {
  gig: GigPaymentSummary;
  payment: GigPayment;
  is_client: boolean;
  server_now: string;
  conversation: GigConversationData;
};

export function GigPaymentPage({
  gig,
  payment,
  is_client: isClient,
  server_now: serverNow,
  conversation,
}: Props) {
  const [confirm, confirmDialog] = useConfirm();
  const retry = useForm({});
  const cancellation = useForm({});

  const currentServerTime = useServerClock(serverNow);
  const expiresMs =
    new Date(payment.expires_at).getTime() -
    new Date(currentServerTime).getTime();
  const isExpired = expiresMs <= 0;

  useEffect(() => {
    if (payment.status !== GigPaymentStatus.Pending) {
      return;
    }

    const serverOffset = new Date(serverNow).getTime() - Date.now();
    const delay =
      new Date(payment.expires_at).getTime() - (Date.now() + serverOffset);

    if (delay <= 0) {
      return;
    }

    const timer = window.setTimeout(
      () => router.reload({ only: ['payment', 'server_now'] }),
      delay + 50,
    );

    return () => window.clearTimeout(timer);
  }, [payment.expires_at, payment.status, serverNow]);

  const hasPaymentActions =
    (!isExpired &&
      (payment.capabilities.can_open_checkout ||
        payment.capabilities.can_retry_checkout ||
        payment.capabilities.can_cancel)) ||
    payment.status === GigPaymentStatus.Paid;

  const totalSecs = Math.max(0, Math.floor(expiresMs / 1000));
  const isUrgent = !isExpired && totalSecs < 3600;

  let countdownText = '';
  if (isExpired) {
    countdownText = 'Telah berakhir';
  } else if (totalSecs < 3600) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    countdownText = `${mins}m ${secs}s lagi`;
  } else {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    countdownText =
      mins > 0 ? `${hours} jam ${mins} menit lagi` : `${hours} jam lagi`;
  }

  return (
    <AppPage
      title={`Pembayaran: ${gig.title}`}
      description="Status transaksi escrow pembayaran demo dan instruksi penyelesaian."
    >
      <div className="flex flex-col gap-6">
        <GigConversation conversation={conversation} />
        <AppPageCard className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground sm:text-base">
                Status Pembayaran
              </span>
            </div>
            <Badge
              variant={getGigPaymentStatusVariant(payment.status)}
              className="px-3 py-1 font-medium"
            >
              {getGigPaymentStatusLabel(payment.status)}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
              <Coins className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Jumlah Pembayaran
                </span>
                <span className="text-lg font-bold text-foreground">
                  Rp{payment.amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Batas Waktu
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formatDate(payment.expires_at, 'dd MMMM yyyy · HH:mm')}
                </span>
                <span
                  className={`text-xs ${
                    isUrgent || isExpired
                      ? 'font-bold text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {countdownText}
                </span>
              </div>
            </div>
          </div>

          {payment.status === GigPaymentStatus.Pending && !isClient && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Menunggu klien menyelesaikan pembayaran demo.</span>
            </div>
          )}

          {payment.status === GigPaymentStatus.Paid && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Pembayaran demo terkonfirmasi. Gig telah dikunci.</span>
            </div>
          )}

          {payment.status === GigPaymentStatus.Cancelled && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>Pembayaran dan gig telah dibatalkan.</span>
            </div>
          )}

          {payment.status === GigPaymentStatus.Expired && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Waktu pembayaran berakhir dan gig telah dibatalkan.</span>
            </div>
          )}

          {hasPaymentActions && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-2">
              {payment.status === GigPaymentStatus.Paid && (
                <Button asChild variant="outline">
                  <Link href={workflow(gig)}>Lihat workflow</Link>
                </Button>
              )}

              {!isExpired && payment.capabilities.can_open_checkout && (
                <Button asChild>
                  <Link href={mockCheckout(gig)}>
                    Lanjutkan pembayaran demo
                  </Link>
                </Button>
              )}

              {!isExpired && payment.capabilities.can_retry_checkout && (
                <Button
                  onClick={() => retry.post(retryCheckout.url(gig))}
                  disabled={retry.processing}
                >
                  Coba siapkan checkout lagi
                </Button>
              )}

              {!isExpired && payment.capabilities.can_cancel && (
                <Button
                  variant="destructive"
                  disabled={cancellation.processing}
                  onClick={() =>
                    confirm({
                      title: 'Batalkan gig ini?',
                      description:
                        'Pembayaran dan proses gig akan dibatalkan secara permanen.',
                      confirmLabel: 'Ya, batalkan gig',
                      destructive: true,
                      onConfirm: () => cancellation.patch(cancel.url(gig)),
                    })
                  }
                >
                  Batalkan gig
                </Button>
              )}
            </div>
          )}
        </AppPageCard>
      </div>
      {confirmDialog}
    </AppPage>
  );
}
