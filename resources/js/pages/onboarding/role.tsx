import { ReactElement, ReactNode } from 'react';
import OnboardingLayout from '@/layout/OnboardingLayout';
import { Button } from '@/components/ui/button';
import PickCard from '@/components/onboarding/pickCard';
import { UserRole } from '@/types/enum';
import { useForm } from '@inertiajs/react';
import onboarding from '@/routes/onboarding';
import freelancer_illustration from '@/assets/illustrations/worker_illustration.png';
import client_illustration from '@/assets/illustrations/client_informal_illustration.png';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

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
    <form onSubmit={submit} className="relative isolate flex flex-1 flex-col gap-8 overflow-hidden">

      <div className="grid gap-4 sm:grid-cols-2 max-sm:mt-auto">
        <PickCard
          title="Menawarkan Jasa"
          description="Saya ingin menawarkan keahlian saya."
          badge="Pekerja"
          illustration={{
            src: freelancer_illustration,
            alt: "Ilustrasi freelancer bekerja dengan laptop",
            height: 240,
            translateY: 100,
            translateX: 30
          }}
          isSelected={data.role === 'freelancer'}
          onSelect={() => setData('role', 'freelancer')}
        />
        <PickCard
          title="Mencari Jasa"
          description="Saya ingin mencari penyedia jasa freelance."
          badge="Pemberi Kerja"
          illustration={{
            src: client_illustration,
            alt: "Ilustrasi klien mencari jasa freelance",
            height: 250,
            translateY: 100,
            translateX: 35
          }}
          isSelected={data.role === 'client'}
          onSelect={() => setData('role', 'client')}
        />
      </div>

      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <Button
          type="submit"
          className="w-full sm:w-auto max-sm:py-7"
          disabled={!data.role || processing}
        >
          {processing ? 'Menyimpan...' : 'Yuk, Lanjut!'}
        </Button>
      </div>
    </form>
  );
}

OnboardingRole.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Pilih peran Anda untuk melanjutkan"
    description="Pilih peran Anda untuk menyesuaikan pengalaman Anda di platform kami."
  >
    {page}
  </OnboardingLayout>
);

export default OnboardingRole;
