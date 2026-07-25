import type { ReactNode } from 'react';

import { SuspensionView } from '@/features/auth/components/suspension-view';
import type { SuspensionProps } from '@/features/auth/components/suspension-view';
import AppLayout from '@/layout/AppLayout';

const SuspensionPage: InertiaPageWithLayout<SuspensionProps> = (props) => (
  <SuspensionView {...props} />
);

SuspensionPage.layout = (page: ReactNode) => (
  <AppLayout title="Akun ditangguhkan">{page}</AppLayout>
);

export default SuspensionPage;
