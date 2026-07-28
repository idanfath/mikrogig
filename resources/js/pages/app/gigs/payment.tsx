import type { ReactNode } from 'react';
import { GigPaymentPage } from '@/features/gigs/components/gig-payment';
import type { GigConversation } from '@/features/gigs/conversation-types';
import type { GigPayment, GigPaymentSummary } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

type Props = {
  gig: GigPaymentSummary;
  payment: GigPayment;
  is_client: boolean;
  server_now: string;
  conversation: GigConversation;
};

const Page: InertiaPageWithLayout<Props> = (props) => (
  <GigPaymentPage {...props} />
);
Page.layout = (page: ReactNode) => (
  <AppLayout title="Pembayaran Gig">{page}</AppLayout>
);

export default Page;
