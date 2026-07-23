import type { ReactNode } from 'react';
import { RoleStep } from '@/features/onboarding/components/role-step';
import OnboardingLayout from '@/layout/OnboardingLayout';

const OnboardingRole: InertiaPageWithLayout = () => <RoleStep />;

OnboardingRole.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Pilih peran Anda untuk melanjutkan"
    description="Pilih peran Anda untuk menyesuaikan pengalaman Anda di platform kami."
  >
    {page}
  </OnboardingLayout>
);

export default OnboardingRole;
