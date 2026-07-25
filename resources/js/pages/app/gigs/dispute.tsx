import type { ReactNode } from 'react';

import { GigDisputeDetailPage } from '@/features/gigs/components/gig-dispute-detail';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<
  Parameters<typeof GigDisputeDetailPage>[0]
> = (props) => <GigDisputeDetailPage {...props} />;

Page.layout = (page: ReactNode) => (
  <AppLayout title="Sengketa Gig">{page}</AppLayout>
);

export default Page;
