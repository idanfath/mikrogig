import type { ReactNode } from 'react';
import { GigWorkflowPage } from '@/features/gigs/components/gig-workflow';
import AppLayout from '@/layout/AppLayout';
const Page: InertiaPageWithLayout<any> = (props) => (
  <GigWorkflowPage {...props} />
);
Page.layout = (page: ReactNode) => (
  <AppLayout title="Workflow Gig">{page}</AppLayout>
);
export default Page;
