import type { ReactNode } from 'react';
import { GigDetail } from '@/features/gigs/components/gig-detail';
import type { Gig, GigOffer } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<{
  gig: Gig;
  my_offer: GigOffer | null;
  can_apply: boolean;
  is_owner: boolean;
}> = (props) => <GigDetail {...props} />;
Page.layout = (page: ReactNode) => (
  <AppLayout title="Detail Gig">{page}</AppLayout>
);
export default Page;
