import type { ReactNode } from 'react';
import { CreateGigForm } from '@/features/gigs/components/create-gig-form';
import type { WageBenchmarkContext } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

type CreateGigPageProps = {
  categories: string[];
  today: string;
  default_province_id?: string | null;
  default_regency_id?: string | null;
  wage_benchmark_context: WageBenchmarkContext;
};

const Page: InertiaPageWithLayout<CreateGigPageProps> = (props) => (
  <CreateGigForm {...props} />
);
Page.layout = (page: ReactNode) => (
  <AppLayout title="Buat Gig">{page}</AppLayout>
);
export default Page;
