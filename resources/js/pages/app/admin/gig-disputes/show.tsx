import type { ReactNode } from 'react';
import { AdminGigDisputeDetail } from '@/features/gigs/components/admin-gig-disputes';
import AppLayout from '@/layout/AppLayout';
const Page: InertiaPageWithLayout<
  Parameters<typeof AdminGigDisputeDetail>[0]
> = (props) => <AdminGigDisputeDetail {...props} />;
Page.layout = (page: ReactNode) => (
  <AppLayout title="Detail Sengketa">{page}</AppLayout>
);
export default Page;
