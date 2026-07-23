import type { ReactNode } from 'react';
import { AvatarStep } from '@/features/onboarding/components/avatar-step';
import type { OnboardingAvatarPageProps } from '@/features/onboarding/types';
import OnboardingLayout from '@/layout/OnboardingLayout';

const OnboardingAvatar: InertiaPageWithLayout<OnboardingAvatarPageProps> = (
  props,
) => <AvatarStep {...props} />;

OnboardingAvatar.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Tambahkan foto profil Anda"
    description="Foto yang jelas membuat profil Anda lebih dipercaya oleh pengguna lain di MikroGig."
  >
    {page}
  </OnboardingLayout>
);

export default OnboardingAvatar;
