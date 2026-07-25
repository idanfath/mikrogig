import type { ReactNode } from 'react';
import { OwnedGigList } from '@/features/gigs/components/owned-gig-list';
import type { Gig, Paginated } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<{ gigs: Paginated<Gig> }> = (props) => (
  <OwnedGigList {...props} />
);
Page.layout = (page: ReactNode) => (
  <AppLayout title="Gig Saya">{page}</AppLayout>
);
export default Page;
