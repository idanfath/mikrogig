import type { ReactNode } from 'react';
import {
  GigWorkflowPage,
  type GigWorkflowPageProps,
} from '@/features/gigs/components/gig-workflow';
import AppLayout from '@/layout/AppLayout';
const Page: InertiaPageWithLayout<GigWorkflowPageProps> = (props) => (
  <GigWorkflowPage {...props} />
);
Page.layout = (page: ReactNode) => (
  <AppLayout title="Workflow Gig">{page}</AppLayout>
);
export default Page;
