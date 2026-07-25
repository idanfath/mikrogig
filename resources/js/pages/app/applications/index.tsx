import type { ReactNode } from 'react';
import { ApplicationList } from '@/features/gigs/components/application-list';
import type { GigOffer, Paginated } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

const Page: InertiaPageWithLayout<{ offers: Paginated<GigOffer> }> = (
    props,
) => <ApplicationList {...props} />;
Page.layout = (page: ReactNode) => (
    <AppLayout title="Lamaran">{page}</AppLayout>
);
export default Page;
