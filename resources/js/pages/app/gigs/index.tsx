import type { ReactNode } from 'react';
import { GigDiscovery } from '@/features/gigs/components/gig-discovery';
import type { Gig, Paginated } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<{
  gigs: Paginated<Gig>;
  filters: Record<string, string>;
  categories: string[];
}> = (props) => <GigDiscovery {...props} />;
Page.layout = (page: ReactNode) => (
  <AppLayout title="Cari Gig">{page}</AppLayout>
);
export default Page;
