import type { ReactNode } from 'react';
import { GigDetail } from '@/features/gigs/components/gig-detail';
import type {
  Gig,
  GigOffer,
  WageBenchmarkContext,
} from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<{
  gig: Gig;
  my_offer: GigOffer | null;
  can_apply: boolean;
  is_owner: boolean;
  has_current_agreement: boolean;
  wage_benchmark_context: WageBenchmarkContext;
}> = (props) => <GigDetail {...props} />;
Page.layout = (page: ReactNode) => (
  <AppLayout title="Detail Gig">{page}</AppLayout>
);
export default Page;
