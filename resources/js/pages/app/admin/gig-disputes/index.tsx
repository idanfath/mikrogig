import type { ReactNode } from 'react';
import { AdminGigDisputeQueue } from '@/features/gigs/components/admin-gig-disputes';
import AppLayout from '@/layout/AppLayout';
const Page: InertiaPageWithLayout<
  Parameters<typeof AdminGigDisputeQueue>[0]
> = (props) => <AdminGigDisputeQueue {...props} />;
Page.layout = (page: ReactNode) => (
  <AppLayout title="Sengketa Admin">{page}</AppLayout>
);
export default Page;
