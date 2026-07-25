import { Link, useForm } from '@inertiajs/react';
import {
  completeMock,
  show,
} from '@/actions/App/Http/Controllers/GigPaymentController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { getGigPaymentStatusLabel } from '@/types/enum';
import type { GigPayment, GigPaymentSummary } from '../types';

type Props = {
  gig: GigPaymentSummary;
  payment: GigPayment;
};

export function MockPaymentCheckoutPage({ gig, payment }: Props) {
  const completion = useForm({});

  return (
    <AppPage title="Checkout Pembayaran Demo">
      <AppPageCard className="flex max-w-xl flex-col gap-4">
        <div className="rounded-md bg-muted p-3 text-sm font-medium">
          Demo payment, no real money is transferred.
        </div>

        <div className="flex flex-col gap-1">
          <strong>{gig.title}</strong>
          <span className="text-sm text-muted-foreground">
            {getGigPaymentStatusLabel(payment.status)} · Rp
            {payment.amount.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {payment.capabilities.can_complete_mock_payment && (
            <Button
              onClick={() => completion.post(completeMock.url(gig))}
              disabled={completion.processing}
            >
              Simulasikan pembayaran berhasil
            </Button>
          )}

          <Button asChild variant="outline">
            <Link href={show(gig)}>Kembali ke status pembayaran</Link>
          </Button>
        </div>
      </AppPageCard>
    </AppPage>
  );
}
