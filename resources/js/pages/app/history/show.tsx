import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { GigHistoryDetail } from '@/features/gigs/components/gig-history-detail';
import type { HistoryShowProps } from '@/features/gigs/history-types';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<HistoryShowProps> = (props) => (
  <>
    <Head title={`Riwayat ${props.gig.title}`} />
    <GigHistoryDetail {...props} />
  </>
);

Page.layout = (page: ReactNode) => (
  <AppLayout title="Detail Riwayat">{page}</AppLayout>
);

export default Page;
