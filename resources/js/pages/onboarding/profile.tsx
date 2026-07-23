import type { ReactNode } from 'react';
import { ProfileStep } from '@/features/onboarding/components/profile-step';
import type { OnboardingProfilePageProps } from '@/features/onboarding/types';
import OnboardingLayout from '@/layout/OnboardingLayout';

const OnboardingProfile: InertiaPageWithLayout<OnboardingProfilePageProps> = (
  props,
) => <ProfileStep {...props} />;

OnboardingProfile.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Lengkapi profil Anda"
    description="Isi profil Anda agar orang lain dapat mengenal Anda lebih baik."
  >
    {page}
  </OnboardingLayout>
);

export default OnboardingProfile;
