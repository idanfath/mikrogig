import type { ReactNode } from 'react';
import { GigAgreementPage } from '@/features/gigs/components/gig-agreement';
import type { Gig, GigAgreement } from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

type Props = {
  gig: Gig;
  agreement: GigAgreement;
  is_client: boolean;
  is_selected_freelancer: boolean;
};

const Page: InertiaPageWithLayout<Props> = (props) => <GigAgreementPage {...props} />;
Page.layout = (page: ReactNode) => <AppLayout title="Persetujuan Gig">{page}</AppLayout>;

export default Page;
