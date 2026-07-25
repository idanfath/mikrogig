import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { GigHistoryList } from '@/features/gigs/components/gig-history-list';
import type { HistoryIndexProps } from '@/features/gigs/history-types';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<HistoryIndexProps> = (props) => (
  <>
    <Head title="Riwayat Gig" />
    <GigHistoryList {...props} />
  </>
);

Page.layout = (page: ReactNode) => (
  <AppLayout title="Riwayat Gig">{page}</AppLayout>
);

export default Page;
