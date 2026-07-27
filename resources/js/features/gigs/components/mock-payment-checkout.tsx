import { Link, useForm } from '@inertiajs/react';
import { Coins, CreditCard, ShieldCheck } from 'lucide-react';
import {
  completeMock,
  show,
} from '@/actions/App/Http/Controllers/GigPaymentController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import {
  getGigPaymentStatusLabel,
  getGigPaymentStatusVariant,
} from '@/types/enum';
import type { GigPayment, GigPaymentSummary } from '../types';

type Props = {
  gig: GigPaymentSummary;
  payment: GigPayment;
};

export function MockPaymentCheckoutPage({ gig, payment }: Props) {
  const [confirm, confirmDialog] = useConfirm();
  const completion = useForm({});

  return (
    <AppPage
      title="Checkout Pembayaran Demo"
      description="Halaman pembayaran simulasi untuk memproses escrow gig."
    >
      <AppPageCard className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-secondary/30 p-3.5 text-xs font-medium text-foreground">
          <CreditCard className="size-4 shrink-0 text-muted-foreground" />
          <span>Pembayaran simulasi (demo), tidak ada uang sungguhan yang ditransfer.</span>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-foreground text-base">{gig.title}</h3>
            <Badge variant={getGigPaymentStatusVariant(payment.status)} className="px-3 py-1 font-medium">
              {getGigPaymentStatusLabel(payment.status)}
            </Badge>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-border/40">
            <Coins className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Tagihan Escrow
              </span>
              <span className="font-bold text-foreground text-lg">
                Rp{payment.amount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/40">
          <Button asChild variant="outline">
            <Link href={show(gig)}>Kembali ke status pembayaran</Link>
          </Button>

          {payment.capabilities.can_complete_mock_payment && (
            <Button
              disabled={completion.processing}
              onClick={() =>
                confirm({
                  title: 'Proses pembayaran demo?',
                  description: 'Dana escrow akan dikunci dan status gig akan diperbarui.',
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
