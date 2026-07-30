import type { ReactNode } from 'react';
import { GigAgreementPage } from '@/features/gigs/components/gig-agreement';
import type { GigConversation } from '@/features/gigs/conversation-types';
import type {
  Gig,
  GigAgreement,
  GigAgreementCapabilities,
  WageBenchmarkContext,
} from '@/features/gigs/types';
import AppLayout from '@/layout/AppLayout';

type Props = {
  gig: Gig;
  agreement: GigAgreement;
  is_client: boolean;
  is_selected_freelancer: boolean;
  capabilities: GigAgreementCapabilities;
  conversation: GigConversation;
  wage_benchmark_context: WageBenchmarkContext;
};

const Page: InertiaPageWithLayout<Props> = (props) => (
  <GigAgreementPage {...props} />
);
Page.layout = (page: ReactNode) => (
  <AppLayout title="Persetujuan Gig">{page}</AppLayout>
);

export default Page;
