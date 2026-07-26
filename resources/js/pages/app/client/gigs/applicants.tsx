import type { ReactNode } from 'react';
import { ApplicantList } from '@/features/gigs/components/applicant-list';
import type { Gig, GigOffer, Paginated } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<{
  gig: Gig;
  offers: Paginated<GigOffer>;
  filters?: { search?: string; status?: string };
  pendingOffersCount: number;
}> = (props) => <ApplicantList {...props} />;
Page.layout = (page: ReactNode) => (
  <AppLayout title="Pelamar">{page}</AppLayout>
);
export default Page;
