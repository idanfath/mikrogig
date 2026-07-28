import { useEffect } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Coins, CreditCard, ShieldCheck } from 'lucide-react';
import {
  completeMock,
  show,
} from '@/actions/App/Http/Controllers/GigPaymentController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { useServerClock } from '@/hooks/use-server-clock';
import {
  GigPaymentStatus,
  getGigPaymentStatusLabel,
  getGigPaymentStatusVariant,
} from '@/types/enum';
import type { GigPayment, GigPaymentSummary } from '../types';

type Props = {
  gig: GigPaymentSummary;
  payment: GigPayment;
  server_now: string;
};

export function MockPaymentCheckoutPage({
  gig,
  payment,
  server_now: serverNow,
}: Props) {
  const [confirm, confirmDialog] = useConfirm();
  const completion = useForm({});
  const currentServerTime = useServerClock(serverNow);
  const isExpired =
    new Date(currentServerTime).getTime() >=
    new Date(payment.expires_at).getTime();

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

  return (
    <AppPage
      title="Checkout Pembayaran Demo"
      description="Halaman pembayaran simulasi untuk memproses escrow gig."
    >
      <AppPageCard className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-secondary/30 p-3.5 text-xs font-medium text-foreground">
          <CreditCard className="size-4 shrink-0 text-muted-foreground" />
          <span>
            Pembayaran simulasi (demo), tidak ada uang sungguhan yang
            ditransfer.
          </span>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground">{gig.title}</h3>
            <Badge
              variant={getGigPaymentStatusVariant(payment.status)}
              className="px-3 py-1 font-medium"
            >
              {getGigPaymentStatusLabel(payment.status)}
            </Badge>
          </div>

          <div className="flex items-start gap-2.5 border-t border-border/40 pt-2">
            <Coins className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Total Tagihan Escrow
              </span>
              <span className="text-lg font-bold text-foreground">
                Rp{payment.amount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-2">
          <Button asChild variant="outline">
            <Link href={show(gig)}>Kembali ke status pembayaran</Link>
          </Button>

          {!isExpired && payment.capabilities.can_complete_mock_payment && (
            <Button
              disabled={completion.processing}
              onClick={() =>
                confirm({
                  title: 'Proses pembayaran demo?',
                  description:
                    'Dana escrow akan dikunci dan status gig akan diperbarui.',
                  confirmLabel: 'Ya, selesaikan pembayaran',
                  onConfirm: () => completion.post(completeMock.url(gig)),
                })
              }
            >
              <ShieldCheck className="mr-1.5 size-4" />
              Simulasikan pembayaran berhasil
            </Button>
          )}
        </div>
      </AppPageCard>
      {confirmDialog}
    </AppPage>
  );
}
