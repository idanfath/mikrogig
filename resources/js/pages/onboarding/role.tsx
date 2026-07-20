import { useForm } from '@inertiajs/react';
import type { ReactElement, ReactNode } from 'react';
import PickCard from '@/components/onboarding/pickCard';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/layout/OnboardingLayout';
import asset from '@/lib/assets';
import onboarding from '@/routes/onboarding';
import { UserRoleFrontendLabel } from '@/types/enum';
import type { UserRole } from '@/types/enum';

const OnboardingRole: InertiaPageWithLayout = () => {
  const { data, setData, post, processing } = useForm({
    role: null as UserRole | null,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (data.role) {
      post(onboarding.role.url());
    }
  };


  return (
    <form
      onSubmit={submit}
      className="relative isolate flex flex-1 flex-col gap-4 overflow-hidden "
    >
      <PickCard
        title="Menawarkan Jasa"
        description="Saya ingin menawarkan keahlian saya."
        badge={UserRoleFrontendLabel.freelancer}
        illustration={{
          src: asset('assets/illustrations/worker_illustration.png'),
          alt: 'Ilustrasi freelancer bekerja dengan laptop',
          height: 240,
          translateY: -35,
          translateX: 0,
        }}
        isSelected={data.role === 'freelancer'}
        onSelect={() => setData('role', 'freelancer')}
      />
      <PickCard
        title="Mencari Jasa"
        description="Saya ingin mencari penyedia jasa freelance."
        badge={UserRoleFrontendLabel.client}
        illustration={{
          src: asset('assets/illustrations/client_informal_illustration.png'),
          alt: 'Ilustrasi klien mencari jasa freelance',
          height: 250,
          translateY: -45,
          translateX: 0,
        }}
        isSelected={data.role === 'client'}
        onSelect={() => setData('role', 'client')}
      />

      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <Button
          type="submit"
          mobileLarge
          className="w-full sm:w-auto"
          disabled={!data.role || processing}
        >
          {processing ? 'Menyimpan...' : 'Yuk, Lanjut!'}
        </Button>
      </div>
    </form>
  );
};

OnboardingRole.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Pilih peran Anda untuk melanjutkan"
    description="Pilih peran Anda untuk menyesuaikan pengalaman Anda di platform kami."
  >
    {page}
  </OnboardingLayout>
);

export default OnboardingRole;
