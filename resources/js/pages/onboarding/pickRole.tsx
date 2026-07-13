import { ReactElement, ReactNode } from 'react';
import OnboardingLayout from '@/layout/OnboardingLayout';
import { Button } from '@/components/ui/button';
import PickCard from '@/components/onboarding/pickCard';
import { UserRole } from '@/types/enum';
import { useForm } from '@inertiajs/react';
import account from '@/routes/account';
import freelancer_illustration from '@/assets/common/freelancer_laptop_illust.png';
import client_illustration from '@/assets/common/client_illust.png';
import { Badge } from '@/components/ui/badge';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const PickRole: InertiaPageWithLayout = () => {
  const { data, setData, post, processing } = useForm({
    role: null as UserRole | null,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.role) {
      post(account.role.select.url(data.role));
    }
  };

  return (
    <form onSubmit={submit} className="relative isolate flex flex-1 flex-col gap-8 overflow-hidden">

      <div className="grid gap-4 sm:grid-cols-2 max-sm:mt-auto">
        <PickCard
          title="Menawarkan Jasa"
          description="Saya ingin menawarkan keahlian saya."
          badge="Freelancer"
          illustration={{
            src: freelancer_illustration,
            alt: "Ilustrasi freelancer bekerja dengan laptop",
            height: 240,
            translateY: 100,
          }}
          isSelected={data.role === 'freelancer'}
          onSelect={() => setData('role', 'freelancer')}
        />
        <PickCard
          title="Mencari Jasa"
          description="Saya ingin mencari penyedia jasa freelance."
          badge="Client"
          illustration={{
            src: client_illustration,
            alt: "Ilustrasi klien mencari jasa freelance",
            height: 400,
            translateY: 250,
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

PickRole.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Pilih peran Anda untuk melanjutkan"
    description="Pilih peran Anda untuk menyesuaikan pengalaman Anda di platform kami."
  >
    {page}
  </OnboardingLayout>
);

export default PickRole;
