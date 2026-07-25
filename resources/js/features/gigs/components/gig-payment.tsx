import { Link, useForm } from '@inertiajs/react';
import { cancel } from '@/actions/App/Http/Controllers/GigController';
import {
  mockCheckout,
  retryCheckout,
} from '@/actions/App/Http/Controllers/GigPaymentController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { GigPaymentStatus, getGigPaymentStatusLabel } from '@/types/enum';
import type { GigPayment, GigPaymentSummary } from '../types';

type Props = {
  gig: GigPaymentSummary;
  payment: GigPayment;
  is_client: boolean;
};

export function GigPaymentPage({ gig, payment, is_client: isClient }: Props) {
  const retry = useForm({});
  const cancellation = useForm({});

  return (
    <AppPage title={`Pembayaran: ${gig.title}`}>
      <AppPageCard className="flex max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Status</span>
          <strong>{getGigPaymentStatusLabel(payment.status)}</strong>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Jumlah</span>
            <br />
            Rp{payment.amount.toLocaleString('id-ID')} {payment.currency}
          </p>
          <p>
            <span className="text-muted-foreground">Batas waktu</span>
            <br />
            {new Date(payment.expires_at).toLocaleString('id-ID')}
          </p>
        </div>

        {payment.status === GigPaymentStatus.Pending && !isClient && (
          <p className="text-sm text-muted-foreground">
            Menunggu klien menyelesaikan pembayaran demo.
          </p>
        )}

        {payment.status === GigPaymentStatus.Paid && (
          <p>Pembayaran demo terkonfirmasi. Gig telah dikunci.</p>
        )}

        {payment.status === GigPaymentStatus.Cancelled && (
          <p>Pembayaran dan gig telah dibatalkan.</p>
        )}

        {payment.status === GigPaymentStatus.Expired && (
          <p>Waktu pembayaran berakhir dan gig telah dibatalkan.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {payment.capabilities.can_open_checkout && (
            <Button asChild>
              <Link href={mockCheckout(gig)}>Lanjutkan pembayaran demo</Link>
            </Button>
          )}

          {payment.capabilities.can_retry_checkout && (
            <Button
              onClick={() => retry.post(retryCheckout.url(gig))}
              disabled={retry.processing}
            >
              Coba siapkan checkout lagi
            </Button>
          )}

          {payment.capabilities.can_cancel && (
            <Button
              variant="destructive"
              onClick={() => cancellation.patch(cancel.url(gig))}
              disabled={cancellation.processing}
            >
              Batalkan gig
            </Button>
          )}
        </div>
      </AppPageCard>
    </AppPage>
  );
}
