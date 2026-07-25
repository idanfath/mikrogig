import type { ReactNode } from 'react';
import { MockPaymentCheckoutPage } from '@/features/gigs/components/mock-payment-checkout';
import type { GigPayment, GigPaymentSummary } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

type Props = {
  gig: GigPaymentSummary;
  payment: GigPayment;
};

const Page: InertiaPageWithLayout<Props> = (props) => (
  <MockPaymentCheckoutPage {...props} />
);
Page.layout = (page: ReactNode) => (
  <AppLayout title="Checkout Demo">{page}</AppLayout>
);

export default Page;
