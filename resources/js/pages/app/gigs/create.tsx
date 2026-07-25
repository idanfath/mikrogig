import type { ReactNode } from 'react';
import { CreateGigForm } from '@/features/gigs/components/create-gig-form';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<{ categories: string[]; today: string }> = (
  props,
) => <CreateGigForm {...props} />;
Page.layout = (page: ReactNode) => (
  <AppLayout title="Buat Gig">{page}</AppLayout>
);
export default Page;
