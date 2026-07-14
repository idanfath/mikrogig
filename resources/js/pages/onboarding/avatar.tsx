import { ReactElement, ReactNode } from 'react';
import OnboardingLayout from '@/layout/OnboardingLayout';
import { Button } from '@/components/ui/button';
import PickCard from '@/components/onboarding/pickCard';
import { UserRole } from '@/types/enum';
import { useForm } from '@inertiajs/react';
import onboarding from '@/routes/onboarding';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const OnboardingAvatar: InertiaPageWithLayout = () => {
  return (
    <></>
  );
}

OnboardingAvatar.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Tambahkan foto profil Anda"
    description="Foto yang jelas membuat profil Anda lebih dipercaya oleh pengguna lain di MikroGig."
  >
    {page}
  </OnboardingLayout>
);

export default OnboardingAvatar;
